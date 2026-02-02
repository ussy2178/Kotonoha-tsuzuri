import { Haiku } from './types'

export const haikuDB: Haiku[] = [
  {
    id: '1',
    text: '古池や 蛙飛びこむ 水の音',
    author: '松尾芭蕉',
    embedding: [0.2, 0.1, 0.9],
  },
  {
    id: '2',
    text: '夏草や 兵どもが 夢の跡',
    author: '松尾芭蕉',
    embedding: [0.8, 0.3, 0.1],
  },
  {
    id: '3',
    text: '柿くへば 鐘が鳴るなり 法隆寺',
    author: '正岡子規',
    embedding: [0.1, 0.9, 0.2],
  },
  {
    id: '4',
    text: '雪とけて村いっぱいの子どもかな',
    author: '小林一茶',
  },
]