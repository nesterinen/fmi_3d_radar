import { useState } from "react"
import { PointCloudType } from "../radar/RadarRenderer"
import { PCDBinput, pointCloudDataBuffer } from "../radar/utils/pcdBuffer"

const useRadarBuffer = (BufferArguments:PCDBinput) => {
    const [pointCloudBuffer] = useState(() => new pointCloudDataBuffer(BufferArguments))
    const [pointCloudData, setPointCloudData] = useState<PointCloudType | undefined>(undefined) 

    function updatePointCloudState() {
        pointCloudBuffer
            .getCurrentCloud()
                .then(pointcloud => {
                    if(pointcloud){
                        pointcloud.name = pointCloudBuffer.getType()
                        setPointCloudData(pointcloud)
                    }
                })
    }

    function nextBuffer() {
        pointCloudBuffer.next()
        updatePointCloudState()
    }

    function previousBuffer() {
        pointCloudBuffer.prev()
        updatePointCloudState()
    }

    function setBuffer(index: number) {
        pointCloudBuffer.setIndex(index)
        updatePointCloudState()
    }

    return {
        pointCloudBuffer,
        pointCloudData,
        updatePointCloudState,
        nextBuffer,
        previousBuffer,
        setBuffer
    }
}

export default useRadarBuffer