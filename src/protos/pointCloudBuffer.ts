import fmiRequestUrl from "./fmiRequestFormatter"
import { PointCloudType } from "../radar/RadarRenderer"
import { tif2points2 } from "../radar/utils/tif2points2"

class pointCloudData {
    hour: number
    url: string
    data: Promise<PointCloudType> | null

    constructor(hour: number){
        this.hour = hour
        this.url = fmiRequestUrl(hour, 'fikes', 'etop', '20')
        this.data = null
    }

    async load() {
        this.data = tif2points2(this.url)
    }

    deload() {
        this.data = null
    }
}


export class pointCloudBuffer {
    bufferSize: number
    index: number
    buffers: number
    pointclouds: pointCloudData[]
    constructor(bufferSize: number){
        this.bufferSize = bufferSize
        this.index = 0
        this.buffers = 2
        this.pointclouds = []
        this.#Initialize()
    }

    #Initialize(){
        for (let hour = 0; hour < this.bufferSize; hour++){
            this.pointclouds.push(new pointCloudData(hour))
        }

        if(this.buffers > this.pointclouds.length) {
            this.buffers = this.pointclouds.length
        }

        //preload for loop with buffers TODO
        for(let i = 0; i <= this.buffers; i++){
            this.pointclouds[i].load()  
        }
        
        //this.pointclouds[0].load()
        //this.pointclouds[1].load()
    }

    #update() {
        this.pointclouds.map(pcd => {
            if (pcd.hour >= this.index && pcd.hour <= this.index + this.buffers) {
                if(pcd.data === null) {
                    pcd.load()
                }
            } else {
                if (pcd.data !== null) {
                    pcd.deload()
                }
            }
        })
    }

    next() {
        if (this.index < this.pointclouds.length - 1) {
            this.index++
            this.#update()
        }
    }

    prev() {
        if (this.index > 0) {
            this.index--
            this.#update()
        }
    }

    async getCurrentCloud(){
        const dataPromise = this.pointclouds[this.index].data
        if(dataPromise){
            return await dataPromise.then(data => {return data})
        }
        return undefined
    }
}

/*
function App() {
  const mybuff = new pointCloudBuffer(6)

  function printData() {
    mybuff.getCurrentCloud().then(data => [
      console.log(data)
    ])
  }

  return (
    <div>
      <button onClick={() => mybuff.prev()}>prev</button>
      <button onClick={() => printData()}>getData</button>
      <button onClick={() => mybuff.next()}>next</button>
      <button onClick={() => console.log(mybuff)}>status</button>
    </div>
  )
}
*/