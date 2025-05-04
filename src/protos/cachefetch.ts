const location = 'http://s3-eu-west-1.amazonaws.com/fmi-opendata-radar-geotiff/2025/03/06/fikes/202503061035_fikes_ppi_0.3_dbzh_qc.tif'

export async function cachefetch(){
    return fetch(location, {
        headers: {
            "Cache-control": "max-age=10"
        },
        cache: "default"
    }).then(data => {
        return data
    })
}

export async function cacheTestFunc() { // first run was 250ms and next ones are 5ms
    const startTime = Date.now()
    cachefetch().then(result => {
      console.log('done:', Date.now() - startTime, 'ms')
      console.log(result)
    })
  }
