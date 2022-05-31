import { atom } from 'recoil';
export const roomIdState = atom({
    key: 'roomIdState',
    default: '',
})
export const roomTitleState = atom({
    key: 'roomTitleState',
    default: '',
})
export const userState = atom({
    key: 'userState',
    default: {},
})