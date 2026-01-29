import{C as s,B as o}from"./app-CsX1gurW.js";const i="\x1B",a="";class h{device=null;isWeb=!s.isNativePlatform();printerService=null;printerCharacteristic=null;connectionListeners=[];async initialize(){this.isWeb||(await o.initialize(),await this.restoreConnection())}addConnectionListener(e){this.connectionListeners.push(e)}removeConnectionListener(e){this.connectionListeners=this.connectionListeners.filter(r=>r!==e)}notifyConnectionChange(e){this.connectionListeners.forEach(r=>r(e))}async restoreConnection(){const e=localStorage.getItem("thermal_printer_id");if(e&&!this.isWeb)try{await o.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,this.notifyConnectionChange(!1)});const r=localStorage.getItem("thermal_printer_name")||"Thermal Printer";this.device={deviceId:e,name:r},await this.discoverPrinterCharacteristics(e),this.notifyConnectionChange(!0),console.log("Restored printer connection:",r)}catch(r){console.log("Could not restore previous connection:",r),localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name")}}async scan(){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");const e=[];return console.log("🔍 Starting BLE scan for thermal printers..."),await o.requestLEScan({},r=>{const t=r.device.name?.toLowerCase()||"";console.log(`📡 Found BLE device: ${r.device.name} (${r.device.deviceId})`),(t.includes("pt")||t.includes("printer")||t.includes("thermal")||t.includes("pos")||t.includes("rpp")||t.includes("xp")||t.includes("t58")||t.includes("mtp")||t.includes("bt")||t.includes("58mm")||t.includes("80mm"))&&!e.find(c=>c.deviceId===r.device.deviceId)&&(console.log(`✅ Detected thermal printer: ${r.device.name}`),e.push(r.device))}),await new Promise(r=>setTimeout(r,5e3)),await o.stopLEScan(),console.log(`🔍 Scan complete. Found ${e.length} printer(s):`,e.map(r=>r.name)),e}async discoverPrinterCharacteristics(e){try{const r=await o.getServices(e);console.log("Discovered services:",r);for(const t of r)for(const n of t.characteristics)if(n.properties.write||n.properties.writeWithoutResponse){console.log("Found writable characteristic:",{service:t.uuid,characteristic:n.uuid}),this.printerService=t.uuid,this.printerCharacteristic=n.uuid;return}throw new Error("No writable characteristic found on printer")}catch(r){throw console.error("Service discovery error:",r),r}}async connect(e,r){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");try{return await o.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}),this.device={deviceId:e,name:r||"Thermal Printer"},await this.discoverPrinterCharacteristics(e),localStorage.setItem("thermal_printer_id",e),localStorage.setItem("thermal_printer_name",r||"Thermal Printer"),this.notifyConnectionChange(!0),!0}catch(t){return console.error("Connection error:",t),this.device=null,!1}}async disconnect(){if(this.device&&!this.isWeb){try{await o.disconnect(this.device.deviceId)}catch(e){console.error("Disconnect error:",e)}this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}}isConnected(){return this.device!==null&&this.printerService!==null&&this.printerCharacteristic!==null}getConnectedDevice(){return this.device}async write(e){if(!this.device||this.isWeb)throw new Error("Printer not connected");if(!this.printerService||!this.printerCharacteristic)throw new Error("Printer characteristics not discovered. Please reconnect.");const t=new TextEncoder().encode(e),n=new DataView(t.buffer);try{console.log("Writing to printer:",{service:this.printerService,characteristic:this.printerCharacteristic,dataLength:t.length}),await o.write(this.device.deviceId,this.printerService,this.printerCharacteristic,n),console.log("Write successful")}catch(c){throw console.error("Write error:",c),new Error(`Failed to write to printer: ${c.message}`)}}async printTest(){const e=[`${i}@`,`${i}a`,`================================
`,`Sabing2m Test Receipt
`,`================================
`,`${i}a\0`,`Date: ${new Date().toLocaleDateString()}
`,`Time: ${new Date().toLocaleTimeString()}
`,`================================
`,`Bluetooth Connection: OK
`,`Printer Status: Connected
`,`================================
`,`


`,`${a}VA\0`].join("");await this.write(e)}async printTicket(e){console.log("[ThermalPrinter] printTicket() called with data:",e);const r=e.side.toUpperCase(),t=e.event_name||"SABONG EVENT";console.log("[ThermalPrinter] Building ESC/POS commands with QR code..."),console.log("[ThermalPrinter] Event name to print:",t);const n=[`${i}@`,`${i}a`,`${i}!0`,`${t}
`,`${i}!\0`,`================================
`,`
`,`${i}a\0`,`${a}(k\x001A2\0`,`${a}(k\x001C`,`${a}(k\x001E0`,`${a}(k${String.fromCharCode(e.ticket_id.length+3)}\x001P0${e.ticket_id}`,`${a}(k\x001Q0`,`
`,`${i}a\0`,`Fight#:  ${e.fight_number}
`,`Teller:  Teller
`,`Receipt: ${e.ticket_id}
`,`
`,`Date:    ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time:    ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`
`,`================================
`,`
`,`${i}!`,`${r} - P${e.amount.toLocaleString()}
`,`${i}!\0`,`Odds: x${e.odds} | Win: P${e.potential_payout.toLocaleString()}
`,`
`,`================================
`,`
`,`${i}a`,`OFFICIAL BETTING RECEIPT
`,`



`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",n.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(n),console.log("[ThermalPrinter] ✅ write() completed successfully")}catch(c){throw console.error("[ThermalPrinter] ❌ write() failed:",c),c}}}const m=new h;export{m as t};
