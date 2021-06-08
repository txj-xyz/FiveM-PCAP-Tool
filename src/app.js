(async _ => {
    
    // Dependencies
    const runWinFile = require('child_process').execFile
    const execWinCommand = require('child_process').exec
    const netInterface = require('network')
    const fs = require('fs')
    const fsdel = require('fs-extra')

    // Server 1 IP address to listen for in the PCAP
    // const serverIP = '103.249.70.33'

    // Auto detect the network interface
    const autoDetectInterface = async _ => {
        return new Promise((resolve) => {
            // Await the interface name from the promise.
            netInterface.get_active_interface((_, obj) => {
                resolve(obj.name)
            })
        })
    }
    const activeInterface = await autoDetectInterface()

    // Function to check to see if fiveM is running on the users PC (THIS MUST BE RUN AS ADMIN FOR THIS TO WORK)
    function FiveMisRunning(win, mac, linux){
        return new Promise(function(resolve, reject){
            const plat = process.platform
            const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
            const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
            cmd === '' || proc === '' ? resolve(false) : null
            execWinCommand(cmd, function(err, stdout, stderr) {
                resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
            })
        })
    }
    
    // Start capture switch here
    const capturePackets = function (switchStatement) {
        // TODO: Convert to ES6 class instead of switch function
        switch (switchStatement) {
            case 'stop':
                // stop the trace so we can start waiting for cab to convert
                runWinFile(`${process.cwd()}\\src\\dependencies\\netsh.exe`, ['trace', 'stop'])

                // start watching for the capture cab file over 500ms
                let watchFile = setInterval(() => {
                    if (fs.existsSync('.\\captures-saved\\pcap.cab')) {
                        clearInterval(watchFile)
                        console.clear()
                        console.log('Converting packet capture, please wait....')
                        runWinFile(`${__dirname}\\dependencies\\etl2pcapng.exe`, ['.\\captures-saved\\pcap.etl', '.\\captures-saved\\converted.pcapng'])
                        console.clear()
                        console.log('Converted files successfully... This will now close...')
                        setTimeout(() => process.exit(0), 3000)
                    }
                }, 500)
                break

            case 'start':
                // start waiting for the FiveM process and log to console.
                FiveMisRunning('FiveM.exe').then((fiveMRunning) => {
                    if(!fiveMRunning){
                        // clear console to mention that fivem is not running
                        console.clear()
                        console.log('FiveM is not currently running, please open FiveM and run this program again...')
                        setTimeout(() => process.exit(1), 5000)
                        // console.log('\n\nPress any key to exit...')
                    }
                    else {
                        // Log out start
                        console.log(`Starting packet capture, please join 'Freeroam Server #1' the capture will begin shortly for 60 seconds...\n\n\n\n\n\n`)
                        // setTimeout(() => { console.clear() }, 3000)

                        // check if folder exists and create it here if not
                        fs.existsSync('.\\captures-saved') ? null : fs.mkdirSync('.\\captures-saved')

                        // clear out the folder just in case we run into file issues
                        fs.readdirSync('.\\captures-saved\\').length != 0 ? fsdel.emptyDirSync('.\\captures-saved') : null

                        // // start capture here with NetSH since it comes with windows and we can just copy it into the deps
                        runWinFile(`${process.cwd()}\\src\\dependencies\\netsh.exe`,
                        ['trace',
                        'start',
                        'capture=yes',
                        `CaptureInterface="${activeInterface}"`,
                        `tracefile="${process.cwd()}\\captures-saved\\pcap.etl"`,
                        `IPv4.Address=CHANGE_ME`],
                        
                        (err, stdout, stderr) => {
                            stdout ? console.log(stdout) : null
                            stderr ? console.log(stderr) : null
                            err ? console.log(err) : null
                        })
                    }
                })
                
                break
            default:
                break
        }
    }
    
    // Start packet capture here 
    capturePackets('start')

    setTimeout(() => {
        capturePackets('stop')
    }, 40 * 1000)
})()