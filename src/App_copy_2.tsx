import RadarRenderer from "./radar/RadarRenderer"
//import ForcutRenderer from "./radar/proto/ForcutRenderer"
//import {pointCloudBuffer} from "./protos/pointCloudBuffer"
import { pointCloudDataBuffer } from "./radar/utils/pcdBuffer"
import { PointCloudType } from "./radar/RadarRenderer"

import { useEffect, useState } from "react"

//import './App.css'
/*
function setPcdState(pcdBuffer: pointCloudDataBuffer, setPcdState: React.Dispatch<React.SetStateAction<PointCloudType | undefined>>) {
  pcdBuffer.getCurrentCloud().then(pointcloud => {
    if(pointcloud){
      pointcloud.name = pcdBuffer.getType()
      setPcdState(pointcloud)
    }
  })
}
*/

function App() {
  const [timeHeader, setTimeHeader] = useState<string | undefined>(undefined)

  const [mybuff] = useState(() => new pointCloudDataBuffer({
    //dateUTCms:new Date('2025-03-10T24:00:00').getTime(),
    buffers: 2
  }))

  const [mybuff2] = useState(() => new pointCloudDataBuffer({
    //dateUTCms:new Date('2025-03-10T24:00:00').getTime(),
    buffers: 2,
    type: {
      station: 'fikes',
      product: 'ppi',
      quantity: '0.3'
    }
  }))

  const [pcdp, setpcdp] = useState<PointCloudType | undefined>(undefined)

  const [pcdp2, setpcdp2] = useState<PointCloudType | undefined>(undefined)

  async function nextf(){
    mybuff.next()
    mybuff.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff.getType()
        setpcdp(pointcloud)
        setTimeHeader(mybuff.getCurrentDate())
      }
    })

    mybuff2.next()
    mybuff2.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff2.getType()
        setpcdp2(pointcloud)
      }
    })
  }

  async function pref(){
    mybuff.prev()
    mybuff.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff.getType()
        setpcdp(pointcloud)
        setTimeHeader(mybuff.getCurrentDate())
      }
    })

    mybuff2.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff2.getType()
        setpcdp2(pointcloud)
      }
    })
  }

  useEffect(() => {
    mybuff.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff.getType()
        setpcdp(pointcloud)
        setTimeHeader(mybuff.getCurrentDate())
      }
    })

    mybuff2.getCurrentCloud().then(pointcloud => {
      if(pointcloud){
        pointcloud.name = mybuff2.getType()
        setpcdp2(pointcloud)
      }
    })
  },[mybuff, mybuff2])

  return (
    <div style={{textAlign:"center", width:"99vw"}}>
      <h2>{timeHeader?timeHeader:'--'}</h2>
      <div style={{minWidth: 500, minHeight: 500, width: '80vw', height: '80vh', border: '1px solid white', justifyContent: 'center', margin:"auto"}}>
        <RadarRenderer pointclouds={[pcdp, pcdp2]}/>
      </div>
      <div>
        <button onClick={() => pref()}>prev</button>
        <button onClick={() => console.log(mybuff)}>status</button>
        <button onClick={() => nextf()}>next</button>
      </div>
    </div>
  )
}
// <RadarRenderer pointcloud={pcdp}/>
// <RadarRenderer/>
// <ForcutRenderer/>
// <button onClick={() => testing()}>aasd</button>

export default App