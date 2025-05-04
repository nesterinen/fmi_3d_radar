// https://en.ilmatieteenlaitos.fi/radar-data-on-aws-s3
// https://www.ilmatieteenlaitos.fi/avoin-data-saatutkat
// https://en.ilmatieteenlaitos.fi/fmi-radar-network

type Stations = 'fianj'| 'fikan'| 'fikes'| 'fikor'| 'fikuo'| 'filuo'| 'finur'| 'fipet'| 'fiuta'| 'fivih'| 'fivim'| 'finrad'| 'finradfast'
type Products = 'ppi'| 'etop'| 'cappi'

type ppi_angles = '0.3'| '0.7'| '1.5'| '3.0'| '5.0'| '9.0'
type etop_dbzh = '-10'| '20'| '45'| '50'
type cappi_values = '600'
type Quantities = ppi_angles | etop_dbzh | cappi_values

function fmiRequestUrl(hoursAgo=0, station:Stations='fikes', product:Products='ppi', quantity:Quantities='3.0') {
    const baseUrl = 'http://fmi-opendata-radar-geotiff.s3-website-eu-west-1.amazonaws.com/'  // 2024/09/17/fivim/202409171145_fivim_ppi_9.0_dbzh_qc.tif

    // convert minutes to 00, 10, 20, 30, 40, 50
    function tenMinuteRound(minutes:string){
        const returnMinutes = Math.floor(parseInt(minutes)/10)*10
        if (returnMinutes == 0) {
            return '00'
        } else {
            return returnMinutes.toString()
        }
    }
    
    // 10.03.25 14-22 snow!
    const today = new Date(Date.now() - 600_000 - (1000*60*60*hoursAgo))  // 600_000 = 10minutes
    const [date, time] = today.toISOString().split('T')
    const [year, month, day] = date.split('-')
    const [hours, minutes] = time.split(':')

    //day = '10'
    
    const clock = hours + tenMinuteRound(minutes)
    
    return baseUrl + `${year}/${month}/${day}/${station}/${year+month+day+clock}_${station}_${product}_${quantity}_dbzh_qc.tif`
}

export default fmiRequestUrl