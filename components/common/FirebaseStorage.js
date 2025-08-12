import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyC6bjzsZjvjZ7MQtmwdhw8K8KZAeQI530k",
    authDomain: "fcm-simulator-f6908.firebaseapp.com",
    databaseURL: "https://fcm-simulator-f6908-default-rtdb.firebaseio.com",
    projectId: "fcm-simulator-f6908",
    storageBucket: "fcm-simulator-f6908.appspot.com",
    messagingSenderId: "800381183411",
    appId: "1:800381183411:web:87a64b0ab047ef39d597c6",
    measurementId: "G-LSTN6W98V4"
};

// Firebase app 초기화
let app;
const existingApps = getApps();
if (existingApps.length > 0) {
    app = existingApps[0];
} else {
    app = initializeApp(firebaseConfig);
}

// Storage 인스턴스를 생성
const storage = getStorage(app);

// 파일 업로드
export async function uploadFile(path, file, metadata = {}) {
  try {
    // path가 유효한지 확인
    if (!path || typeof path !== 'string') {
      throw new Error('유효하지 않은 파일 경로입니다.');
    }
    
    // file이 유효한지 확인
    if (!file || !(file instanceof File || file instanceof Blob)) {
      throw new Error('유효하지 않은 파일입니다.');
    }
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("파일 업로드 실패:", error);
    console.error("Path:", path);
    console.error("File:", file);
    throw error;
  }
}

// 파일 URL 가져오기
export async function getFileURL(path) {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("파일 URL 가져오기 실패:", error);
    return null;
  }
}

// 파일 삭제
export async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("파일 삭제 실패:", error);
    return false;
  }
}

// 폴더의 모든 파일 목록 가져오기
export async function listFiles(folderPath) {
  try {
    const listRef = ref(storage, folderPath);
    const res = await listAll(listRef);
    
    const files = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error("파일 목록 가져오기 실패:", error);
    return [];
  }
}

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 확장자 가져오기
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

// 파일 타입별 아이콘 결정
export function getFileIcon(filename) {
  const ext = getFileExtension(filename).toLowerCase();
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  const docExts = ['doc', 'docx', 'pdf', 'txt'];
  const excelExts = ['xls', 'xlsx', 'csv'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv'];
  
  if (imageExts.includes(ext)) return 'faImage';
  if (docExts.includes(ext)) return 'faFileAlt';
  if (excelExts.includes(ext)) return 'faFileExcel';
  if (codeExts.includes(ext)) return 'faFileCode';
  if (videoExts.includes(ext)) return 'faFileVideo';
  
  return 'faFile';
}