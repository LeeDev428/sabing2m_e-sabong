import{C as l,B as c}from"./app-k7qnqdcq.js";const r="\x1B",a="";class h{device=null;isWeb=!l.isNativePlatform();printerService=null;printerCharacteristic=null;connectionListeners=[];async initialize(){this.isWeb||(await c.initialize(),await this.restoreConnection())}addConnectionListener(e){this.connectionListeners.push(e)}removeConnectionListener(e){this.connectionListeners=this.connectionListeners.filter(t=>t!==e)}notifyConnectionChange(e){this.connectionListeners.forEach(t=>t(e))}async restoreConnection(){const e=localStorage.getItem("thermal_printer_id");if(e&&!this.isWeb)try{await c.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,this.notifyConnectionChange(!1)});const t=localStorage.getItem("thermal_printer_name")||"Thermal Printer";this.device={deviceId:e,name:t},await this.discoverPrinterCharacteristics(e),this.notifyConnectionChange(!0),console.log("Restored printer connection:",t)}catch(t){console.log("Could not restore previous connection:",t),localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name")}}async scan(){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");const e=[];return console.log("🔍 Starting BLE scan for thermal printers..."),await c.requestLEScan({},t=>{const i=t.device.name?.toLowerCase()||"";console.log(`📡 Found BLE device: ${t.device.name} (${t.device.deviceId})`),(i.includes("pt")||i.includes("printer")||i.includes("thermal")||i.includes("pos")||i.includes("rpp")||i.includes("xp")||i.includes("t58")||i.includes("mtp")||i.includes("bt")||i.includes("58mm")||i.includes("80mm"))&&!e.find(o=>o.deviceId===t.device.deviceId)&&(console.log(`✅ Detected thermal printer: ${t.device.name}`),e.push(t.device))}),await new Promise(t=>setTimeout(t,5e3)),await c.stopLEScan(),console.log(`🔍 Scan complete. Found ${e.length} printer(s):`,e.map(t=>t.name)),e}async discoverPrinterCharacteristics(e){try{const t=await c.getServices(e);console.log("Discovered services:",t);for(const i of t)for(const n of i.characteristics)if(n.properties.write||n.properties.writeWithoutResponse){console.log("Found writable characteristic:",{service:i.uuid,characteristic:n.uuid}),this.printerService=i.uuid,this.printerCharacteristic=n.uuid;return}throw new Error("No writable characteristic found on printer")}catch(t){throw console.error("Service discovery error:",t),t}}async connect(e,t){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");try{return await c.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}),this.device={deviceId:e,name:t||"Thermal Printer"},await this.discoverPrinterCharacteristics(e),localStorage.setItem("thermal_printer_id",e),localStorage.setItem("thermal_printer_name",t||"Thermal Printer"),this.notifyConnectionChange(!0),!0}catch(i){return console.error("Connection error:",i),this.device=null,!1}}async disconnect(){if(this.device&&!this.isWeb){try{await c.disconnect(this.device.deviceId)}catch(e){console.error("Disconnect error:",e)}this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}}isConnected(){return this.device!==null&&this.printerService!==null&&this.printerCharacteristic!==null}getConnectedDevice(){return this.device}async write(e){if(!this.device||this.isWeb)throw new Error("Printer not connected");if(!this.printerService||!this.printerCharacteristic)throw new Error("Printer characteristics not discovered. Please reconnect.");const i=new TextEncoder().encode(e),n=new DataView(i.buffer);try{console.log("Writing to printer:",{service:this.printerService,characteristic:this.printerCharacteristic,dataLength:i.length}),await c.write(this.device.deviceId,this.printerService,this.printerCharacteristic,n),console.log("Write successful")}catch(o){throw console.error("Write error:",o),new Error(`Failed to write to printer: ${o.message}`)}}async printTest(){const e=[`${r}@`,`${r}a`,`================================
`,`Sabing2m Test Receipt
`,`================================
`,`${r}a\0`,`Date: ${new Date().toLocaleDateString()}
`,`Time: ${new Date().toLocaleTimeString()}
`,`================================
`,`Bluetooth Connection: OK
`,`Printer Status: Connected
`,`================================
`,`
`,`${a}VA\0`].join("");await this.write(e)}async printTicket(e){console.log("[ThermalPrinter] printTicket() called with data:",e);const t=e.side.toUpperCase(),i=e.event_name||"SABONG EVENT";console.log("[ThermalPrinter] Building ESC/POS commands with QR code..."),console.log("[ThermalPrinter] Event name to print:",i);const n=[`${r}@`,`${r}a`,`${r}!`,`${i}
`,`${r}!\0`,`================================
`,`${r}a\0`,`${a}(k\x001A2\0`,`${a}(k\x001C`,`${a}(k\x001E0`,`${a}(k${String.fromCharCode(e.ticket_id.length+3)}\x001P0${e.ticket_id}`,`${a}(k\x001Q0`,`
`,`${r}a\0`,`Fight#: ${e.fight_number}
`,`Teller: Teller
`,`Receipt: ${e.ticket_id}
`,`Date: ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time: ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`================================
`,`
`,`${r}a`,`${r}!0`,`${t} - P${e.amount.toLocaleString()}
`,`${r}!\0`,`
`,`================================
`,`
`,`${r}a`,`OFFICIAL BETTING RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",n.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(n),console.log("[ThermalPrinter] ✅ write() completed successfully")}catch(o){throw console.error("[ThermalPrinter] ❌ write() failed:",o),o}}async printPayoutReceipt(e){console.log("[ThermalPrinter] printPayoutReceipt() called with data:",e);const t=e.side.toUpperCase(),i=e.event_name||"SABONG EVENT";console.log("[ThermalPrinter] Building payout receipt ESC/POS commands...");const n=[`${r}@`,`${r}a`,`${r}!`,`${i}
`,`${r}!\0`,`================================
`,`${r}a`,`${r}!\b`,`PAYOUT RECEIPT
`,`${r}!\0`,`================================
`,`${r}a\0`,`Fight#: ${e.fight_number}
`,`Bet By: ${e.bet_by}
`,`Claimed By: ${e.claimed_by}
`,`Receipt: ${e.ticket_id}
`,`Date: ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time: ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`================================
`,`
`,`${r}a\0`,`Side: ${t}
`,`Bet Amount: P${e.bet_amount.toLocaleString()}
`,`Odds: ${e.odds}x
`,`================================
`,`
`,`${r}a`,`${r}!0`,`PAYOUT: P${e.payout_amount.toLocaleString()}
`,`${r}!\0`,`
`,`================================
`,`
`,`${r}a`,`WINNER - CLAIM RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",n.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(n),console.log("[ThermalPrinter] ✅ Payout receipt printed successfully")}catch(o){throw console.error("[ThermalPrinter] ❌ Payout receipt print failed:",o),o}}async printRefundReceipt(e){console.log("[ThermalPrinter] printRefundReceipt() called with data:",e);const t=e.side.toUpperCase(),i=e.event_name||"SABONG EVENT",n=e.refund_reason||"DRAW";console.log("[ThermalPrinter] Building refund receipt ESC/POS commands...");const o=[`${r}@`,`${r}a`,`${r}!`,`${i}
`,`${r}!\0`,`================================
`,`${r}a`,`${r}!\b`,`REFUND RECEIPT
`,`${r}!\0`,`Reason: ${n}
`,`================================
`,`${r}a\0`,`Fight#: ${e.fight_number}
`,`Bet By: ${e.bet_by}
`,`Refunded By: ${e.claimed_by}
`,`Receipt: ${e.ticket_id}
`,`Date: ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time: ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`================================
`,`
`,`${r}a\0`,`Side: ${t}
`,`Bet Amount: P${e.bet_amount.toLocaleString()}
`,`================================
`,`
`,`${r}a`,`${r}!0`,`REFUND: P${e.refund_amount.toLocaleString()}
`,`${r}!\0`,`
`,`================================
`,`
`,`${r}a`,`${n} - REFUND RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",o.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(o),console.log("[ThermalPrinter] ✅ Refund receipt printed successfully")}catch(s){throw console.error("[ThermalPrinter] ❌ Refund receipt print failed:",s),s}}}const C=new h;export{C as t};
