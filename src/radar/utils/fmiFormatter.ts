// https://en.ilmatieteenlaitos.fi/radar-data-on-aws-s3
// https://www.ilmatieteenlaitos.fi/avoin-data-saatutkat
// https://en.ilmatieteenlaitos.fi/fmi-radar-network

export type Stations = 'fianj'| 'fikan'| 'fikes'| 'fikor'| 'fikuo'| 'filuo'| 'finur'| 'fipet'| 'fiuta'| 'fivih'| 'fivim'| 'finrad'| 'finradfast'
export type Products = 'ppi'| 'etop'| 'cappi'

type ppi_angles = '0.3'| '0.7'| '1.5'| '3.0'| '5.0'| '9.0'
type etop_dbzh = '-10'| '20'| '45'| '50'
type cappi_values = '600'
export type Quantities = ppi_angles | etop_dbzh | cappi_values

export function fmiUrlConstructor(timeObject:TimeObject, station:Stations='fikes', product:Products='ppi', quantity:Quantities='3.0') {
    const baseUrl = 'http://fmi-opendata-radar-geotiff.s3-website-eu-west-1.amazonaws.com/'  // 2024/09/17/fivim/202409171145_fivim_ppi_9.0_dbzh_qc.tif
    const {year, month, day, hours, minutes} = timeObject
    return baseUrl + `${year}/${month}/${day}/${station}/${year+month+day+hours+minutes}_${station}_${product}_${quantity}_dbzh_qc.tif`

}

export type TimeObject = {
    year: string, month: string, day: string,
    hours: string, minutes: string
}

export function dateStrings(hoursAgo=0, UTCmilliseconds=Date.now(), tenMinuteDelay=true):TimeObject {
    // convert minutes to 00, 10, 20, 30, 40, 50
    function tenMinuteRound(minutes: string){
        const returnMinutes = Math.floor(parseInt(minutes)/10)*10
        if (returnMinutes == 0) {
            return '00'
        } else {
            return returnMinutes.toString()
        }
    }

    const delay = tenMinuteDelay ? 600_000 : 0  // 600_000ms = 10minutes
    hoursAgo = 1000*60*60*hoursAgo  // hours to milliseconds
    const today = new Date(UTCmilliseconds - hoursAgo - delay)
    const [date, time] = today.toISOString().split('T')
    const [year, month, day] = date.split('-')
    const [hours, minutes] = time.split(':')

    return {year, month, day, hours, minutes:tenMinuteRound(minutes)}
}

/*
const startDate = new Date('2025-03-10T19:00:00').getTime()
const time = dateStrings(0, startDate, false)
console.log(fmiUrlConstructor(time, 'fikes', 'etop', '20'))
*/