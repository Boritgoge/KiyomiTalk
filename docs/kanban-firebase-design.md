# 칸반보드 Firebase 연동 설계 문서

## 1. 개요
KiyomiTalk 칸반보드를 Firebase Realtime Database와 연동하여 실시간 협업이 가능한 프로젝트 관리 도구로 구현합니다.

## 2. 데이터 구조 설계

### 2.1 Firebase Database Schema

```javascript
{
  "boards": {
    "boardId": {
      "id": "boardId",
      "title": "프로젝트 칸반보드",
      "description": "프로젝트 설명",
      "owner": "userId",
      "members": {
        "userId1": {
          "role": "owner",  // owner, admin, member, viewer
          "displayName": "사용자명",
          "email": "user@email.com",
          "photoURL": "https://...",
          "joinedAt": "timestamp"
        },
        "userId2": { ... }
      },
      "visibility": "private", // private, team, public
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "settings": {
        "allowMemberInvite": true,
        "requireApproval": false,
        "defaultColumnIds": ["todo", "in-progress", "review", "done"]
      }
    }
  },
  
  "columns": {
    "boardId": {
      "columnId": {
        "id": "columnId",
        "boardId": "boardId",
        "title": "To Do",
        "color": "#ff6b6b",
        "position": 0,
        "limit": 10, // WIP limit
        "createdAt": "timestamp",
        "createdBy": "userId"
      }
    }
  },
  
  "cards": {
    "boardId": {
      "cardId": {
        "id": "cardId",
        "boardId": "boardId",
        "columnId": "columnId",
        "title": "작업 제목",
        "description": "작업 설명",
        "priority": "high", // low, medium, high, urgent
        "status": "active", // active, archived, deleted
        "position": 0,
        "assignees": ["userId1", "userId2"],
        "tags": ["frontend", "bug"],
        "dueDate": "2024-12-31",
        "attachments": [
          {
            "name": "file.pdf",
            "url": "https://...",
            "size": 1024,
            "uploadedBy": "userId",
            "uploadedAt": "timestamp"
          }
        ],
        "checklist": [
          {
            "id": "checklistId",
            "text": "서브 태스크",
            "completed": false
          }
        ],
        "comments": {
          "commentId": {
            "text": "댓글 내용",
            "author": "userId",
            "createdAt": "timestamp",
            "editedAt": "timestamp"
          }
        },
        "createdBy": "userId",
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "movedAt": "timestamp",
        "movedBy": "userId"
      }
    }
  },
  
  "users": {
    "userId": {
      "uid": "userId",
      "displayName": "사용자명",
      "email": "user@email.com",
      "photoURL": "https://...",
      "boards": {
        "boardId1": true,
        "boardId2": true
      },
      "recentBoards": ["boardId1", "boardId2"],
      "preferences": {
        "defaultView": "board", // board, list, calendar
        "notifications": {
          "cardAssigned": true,
          "cardMoved": true,
          "cardCommented": true,
          "dueDateReminder": true
        }
      },
      "createdAt": "timestamp",
      "lastLoginAt": "timestamp"
    }
  },
  
  "activities": {
    "boardId": {
      "activityId": {
        "id": "activityId",
        "boardId": "boardId",
        "type": "card_moved", // card_created, card_moved, card_updated, member_added, etc.
        "userId": "userId",
        "userName": "사용자명",
        "targetId": "cardId or userId",
        "targetTitle": "카드 제목",
        "fromColumn": "columnId",
        "toColumn": "columnId",
        "description": "활동 설명",
        "timestamp": "timestamp"
      }
    }
  },
  
  "invitations": {
    "inviteCode": {
      "boardId": "boardId",
      "invitedBy": "userId",
      "email": "invited@email.com",
      "role": "member",
      "expiresAt": "timestamp",
      "createdAt": "timestamp",
      "status": "pending" // pending, accepted, rejected, expired
    }
  }
}
```

## 3. 주요 기능 설계

### 3.1 사용자 인증 및 권한 관리

#### 권한 레벨
- **Owner**: 보드 삭제, 모든 설정 변경 가능
- **Admin**: 멤버 관리, 컬럼 관리, 모든 카드 수정 가능
- **Member**: 카드 생성/수정, 자신이 할당된 카드 관리
- **Viewer**: 읽기 전용

#### 구현 내용
```javascript
// 권한 체크 함수
const checkPermission = (board, userId, requiredRole) => {
  const member = board.members[userId];
  if (!member) return false;
  
  const roleHierarchy = { viewer: 0, member: 1, admin: 2, owner: 3 };
  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
};
```

### 3.2 보드 관리 기능

#### 개인 워크스페이스
- 사용자별 개인 보드 목록
- 최근 접속한 보드
- 즐겨찾기 보드

#### 팀 협업
- 멤버 초대 (이메일 또는 링크)
- 실시간 멤버 활동 표시
- 멤버별 색상 구분

### 3.3 검색 및 필터링

#### 검색 기능
- 카드 제목/설명 검색
- 태그 검색
- 담당자 검색
- 날짜 범위 검색

#### 필터 옵션
```javascript
const filterOptions = {
  assignee: ['나에게 할당됨', '할당 안됨', '특정 사용자'],
  priority: ['urgent', 'high', 'medium', 'low'],
  dueDate: ['오늘', '이번 주', '기한 지남', '기한 없음'],
  tags: ['선택된 태그들'],
  status: ['active', 'archived']
};
```

### 3.4 실시간 동기화

#### 실시간 업데이트 항목
- 카드 이동/수정/삭제
- 새 카드 추가
- 멤버 커서 위치
- 타이핑 인디케이터
- 활동 로그

#### 충돌 해결
- Optimistic UI 적용
- 마지막 업데이트 타임스탬프 기반 병합

### 3.5 알림 시스템

#### 알림 유형
- 카드 할당 알림
- 댓글 알림
- 마감일 리마인더
- 멤버 초대 알림

## 4. UI/UX 설계

### 4.1 보드 선택 화면
```
┌─────────────────────────────────────┐
│  내 워크스페이스                      │
├─────────────────────────────────────┤
│  🔍 보드 검색...                     │
├─────────────────────────────────────┤
│  ⭐ 즐겨찾기                         │
│  📋 프로젝트 A                       │
│  📋 프로젝트 B                       │
├─────────────────────────────────────┤
│  최근 보드                           │
│  📋 마케팅 캠페인 (2시간 전)          │
│  📋 개발 태스크 (어제)               │
├─────────────────────────────────────┤
│  팀 보드                             │
│  👥 개발팀 보드 (5명)                │
│  👥 디자인팀 보드 (3명)              │
├─────────────────────────────────────┤
│  [+ 새 보드 만들기]                  │
└─────────────────────────────────────┘
```

### 4.2 보드 헤더 개선
```
┌─────────────────────────────────────────────────────┐
│  📋 프로젝트 칸반보드                                │
│  ├─ 👥 멤버(5)  ├─ 🏷️ 필터  ├─ 🔍 검색           │
│  └─ ⚙️ 설정    └─ 📊 통계   └─ 🔗 공유           │
└─────────────────────────────────────────────────────┘
```

### 4.3 카드 상세 뷰
```
┌──────────────────────────────────┐
│  카드 제목                        │
├──────────────────────────────────┤
│  👤 담당자: @user1, @user2        │
│  📅 마감일: 2024-12-31           │
│  🏷️ 태그: #frontend #urgent      │
│  📎 첨부: file.pdf (2)           │
├──────────────────────────────────┤
│  설명                            │
│  [마크다운 에디터]               │
├──────────────────────────────────┤
│  ✅ 체크리스트 (2/5)            │
│  ☑️ 작업 1                       │
│  ☑️ 작업 2                       │
│  ⬜ 작업 3                       │
├──────────────────────────────────┤
│  💬 댓글 (3)                     │
│  └─ 댓글 입력...                 │
├──────────────────────────────────┤
│  📝 활동 로그                     │
│  • user1이 카드를 이동함         │
│  • user2가 댓글을 남김           │
└──────────────────────────────────┘
```

### 4.4 멤버 관리 모달
```
┌─────────────────────────────────┐
│  보드 멤버 관리                  │
├─────────────────────────────────┤
│  현재 멤버 (5)                   │
│  ┌──────────────────────────┐   │
│  │ 👤 User1 (Owner)    🗑️   │   │
│  │ 👤 User2 (Admin)    🔽   │   │
│  │ 👤 User3 (Member)   🔽   │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  멤버 초대                       │
│  📧 이메일 주소 입력...          │
│  역할: [Member ▼]               │
│  [초대 보내기]                   │
├─────────────────────────────────┤
│  초대 링크                       │
│  🔗 https://...../invite/xyz     │
│  [복사] [새로 생성]              │
└─────────────────────────────────┘
```

## 5. 구현 계획

### Phase 1: 기본 구조 (1-2일)
- [x] Firebase 연동 설정
- [ ] 데이터 모델 구현
- [ ] 기본 CRUD 작업

### Phase 2: 사용자 시스템 (2-3일)
- [ ] 로그인/회원가입 연동
- [ ] 사용자별 보드 목록
- [ ] 권한 관리 시스템

### Phase 3: 실시간 기능 (2-3일)
- [ ] 실시간 카드 동기화
- [ ] 멤버 활동 표시
- [ ] 충돌 해결 로직

### Phase 4: 고급 기능 (3-4일)
- [ ] 검색/필터링
- [ ] 알림 시스템
- [ ] 활동 로그
- [ ] 파일 첨부

### Phase 5: 최적화 (1-2일)
- [ ] 성능 최적화
- [ ] 오프라인 지원
- [ ] 에러 처리

## 6. 기술 스택

- **Frontend**: Next.js, React, SCSS
- **Backend**: Firebase Realtime Database
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (파일 첨부)
- **State**: Recoil + Firebase Listeners
- **UI Library**: 기존 컴포넌트 재사용

## 7. 보안 고려사항

- Firebase Security Rules 설정
- 사용자 권한 검증
- XSS 방지
- 민감 정보 암호화
- Rate Limiting

## 8. 성능 최적화

- 페이지네이션 (보드/카드 목록)
- 이미지 lazy loading
- 캐싱 전략
- 불필요한 re-render 방지
- Firebase 쿼리 최적화