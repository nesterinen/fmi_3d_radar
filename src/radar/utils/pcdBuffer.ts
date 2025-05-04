import { fmiUrlConstructor, dateStrings, Stations, Products, Quantities } from "./fmiFormatter"
import { tif2points2 } from "./tif2points2"
import { PointCloudType } from "../RadarRenderer"

class pointCloudData {
    dateUTCms: number
    hour: number
    url: string
    data: Promise<PointCloudType> | null

    constructor(hour:number, dateUTCms:number, typeObject:RadarParameters){
        //this.date = `${dateObject.year}-${dateObject.month}-${dateObject.day}T${dateObject.hours}:${dateObject.minutes}`
        this.dateUTCms = dateUTCms - (1000*60*60*hour)
        this.hour = hour//parseInt(dateObject.hours)
        this.data = null
        this.url = fmiUrlConstructor(
            dateStrings(hour, dateUTCms, true),
            typeObject.station,
            typeObject.product,
            typeObject.quantity
        )
        //this.url = fmiUrlConstructor(dateObject, 'fikes', 'ppi', '0.3')
    }

    async load() {
        this.data = tif2points2(this.url)
    }

    deload() {
        this.data = null
    }
}

type RadarParameters = {
    station: Stations,
    product: Products,
    quantity: Quantities
}

export type PCDBinput = {
    hours?: number | undefined,
    dateUTCms?: number | undefined,
    buffers?: number | undefined,
    type?: RadarParameters | undefined
}
// class should be pascalcase not camelcase?
export class pointCloudDataBuffer {
    type: RadarParameters
    index: number
    hours: number
    date: number
    buffers: number
    pointclouds: pointCloudData[]
    constructor({dateUTCms, hours, buffers, type}:PCDBinput){
        this.type = type ? type : {
            station: 'fikes',
            product: 'etop',
            quantity: '20'
        }
        this.index = 0
        this.hours = hours ? hours : 24
        this.date = dateUTCms ? dateUTCms : Date.now()
        this.buffers = buffers ? buffers : 0
        this.pointclouds = []
        this.#Initialize()
    }

    #Initialize(){
        for (let hour = 0; hour < this.hours; hour++){
            //const dateObject = dateStrings(hour, this.date, true)
            //this.pointclouds.push(new pointCloudData(hour, dateObject, this.type))
            this.pointclouds.push(new pointCloudData(hour, this.date, this.type))
        }

        // cant be more buffers than there is hours, index overflow
        if(this.buffers > this.pointclouds.length) {
            //this.buffers = this.pointclouds.length
            throw new Error('Too many buffers assigned, overflow.')
        } else if (this.buffers < 0) {
            //this.buffers = 0
            throw new Error('Too many buffers assigned, negative number.')
        }

        // load buffers
        for(let i = 0; i <= this.buffers; i++){
            this.pointclouds[i].load()  
        }
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

    // getIndexData or getCurrentIndexPointcloudData
    async getCurrentCloud(){
        const dataPromise = this.pointclouds[this.index].data
        if(dataPromise){
            return await dataPromise.then(data => {return data})
        }
        return undefined
    }

    getCurrentDate() {
        //return this.pointclouds[this.index].dateUTCms
        const time = dateStrings(0, this.pointclouds[this.index].dateUTCms, true)
        const dateObject = new Date(`${time.year}-${time.month}-${time.day}T${time.hours}:${time.minutes}:00.000+00:00`)
        return +dateObject.getTime()
    }

    getType() {
        return `${this.type.station}_${this.type.product}_${this.type.quantity}`
    }

    setIndex(index: number) {
        if (index >= 0 && index <= this.pointclouds.length) {
            this.index = index
            this.#update()
        } else {
            throw new Error('Index out of bounds.')
        }
    }

    // setDate(UTCms:num)  or? do that outside this class??
}