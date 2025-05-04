import RadarRenderer from "./radar/RadarRenderer"
import { useEffect, useState } from "react"

import useRadarBuffer from "./protos/bufferhook"

// leaflet image TODO
// https://github.com/mapbox/leaflet-image
// get map with leaflet, create img from it and apply it to 3js planem texture.
// or https://docs.mapbox.com/api/maps/static-images/

// OR webgl earth
// https://www.webglearth.com/#ll=61.83447,27.94504;alt=213093;h=-51.107;t=29.772

function App() {
  const [timeHeader, setTimeHeader] = useState<string | undefined>(undefined)
  
  const buffer1 = useRadarBuffer({
    dateUTCms:new Date('2025-03-10T24:00:00').getTime(),
    buffers: 2,
    type: {
      station: 'fikes',
      product: 'etop',
      quantity: '20'
    }
  })

  const buffer2 = useRadarBuffer({
    dateUTCms:new Date('2025-03-10T24:00:00').getTime(),
    buffers: 2,
    type: {
      station: 'fikes',
      product: 'ppi',
      quantity: '3.0'
    }
  })

  /*
  const buffer2 = useRadarBuffer({
    //dateUTCms:new Date('2025-03-10T24:00:00').getTime(),
    buffers: 2,
    type: {
      station: 'fikes',
      product: 'ppi',
      quantity: '9.0'
    }
  })
  */
  

  function setTime() {
    const timeDate = new Date(buffer1.pointCloudBuffer.getCurrentDate())
    setTimeHeader(timeDate.toString())
  }


  async function nextf(){
    buffer1.nextBuffer()
    buffer2.nextBuffer()
    setTime()
  }

  async function pref(){
    buffer1.previousBuffer()
    buffer2.previousBuffer()
    setTime()
  }

  async function setBufferindex(){
    buffer1.setBuffer(0)
    buffer2.setBuffer(0)
    setTime()
  }

  useEffect(() => {
    buffer1.updatePointCloudState()
    buffer2.updatePointCloudState()
    setTime()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  return (
    <div style={{textAlign:"center", width:"99vw"}}>
      <h2>{timeHeader?timeHeader:'--'}</h2>
      <div style={{minWidth: 500, minHeight: 500, width: '80vw', height: '80vh', border: '1px solid white', justifyContent: 'center', margin:"auto"}}>
        <RadarRenderer pointclouds={[buffer1.pointCloudData , buffer2.pointCloudData]}/>
      </div>
      <div>
        <button onClick={() => pref()}>prev</button>
        <button onClick={() => console.log(buffer1.pointCloudBuffer)}>status</button>
        <button onClick={() => setBufferindex()}>zero</button>
        <button onClick={() => nextf()}>next</button>
      </div>
    </div>
  )
}

// <RadarRenderer pointclouds={[buffer1.pointCloudData, buffer2.pointCloudData]}/>
// <RadarRenderer pointcloud={pcdp}/>
// <RadarRenderer/>
// <ForcutRenderer/>
// <button onClick={() => testing()}>aasd</button>

export default App