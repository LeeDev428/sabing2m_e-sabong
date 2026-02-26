import{C as l,B as c}from"./app-BT34oJB2.js";const t="\x1B",a="";class d{device=null;isWeb=!l.isNativePlatform();printerService=null;printerCharacteristic=null;connectionListeners=[];async initialize(){this.isWeb||(await c.initialize(),await this.restoreConnection())}addConnectionListener(e){this.connectionListeners.push(e)}removeConnectionListener(e){this.connectionListeners=this.connectionListeners.filter(r=>r!==e)}notifyConnectionChange(e){this.connectionListeners.forEach(r=>r(e))}async restoreConnection(){const e=localStorage.getItem("thermal_printer_id");if(e&&!this.isWeb)try{await c.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,this.notifyConnectionChange(!1)});const r=localStorage.getItem("thermal_printer_name")||"Thermal Printer";this.device={deviceId:e,name:r},await this.discoverPrinterCharacteristics(e),this.notifyConnectionChange(!0),console.log("Restored printer connection:",r)}catch(r){console.log("Could not restore previous connection:",r),localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name")}}async scan(){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");const e=[];return console.log("🔍 Starting BLE scan for thermal printers..."),await c.requestLEScan({},r=>{const n=r.device.name?.toLowerCase()||"";console.log(`📡 Found BLE device: ${r.device.name} (${r.device.deviceId})`),(n.includes("pt")||n.includes("printer")||n.includes("thermal")||n.includes("pos")||n.includes("rpp")||n.includes("xp")||n.includes("t58")||n.includes("mtp")||n.includes("bt")||n.includes("58mm")||n.includes("80mm"))&&!e.find(o=>o.deviceId===r.device.deviceId)&&(console.log(`✅ Detected thermal printer: ${r.device.name}`),e.push(r.device))}),await new Promise(r=>setTimeout(r,5e3)),await c.stopLEScan(),console.log(`🔍 Scan complete. Found ${e.length} printer(s):`,e.map(r=>r.name)),e}async discoverPrinterCharacteristics(e){try{const r=await c.getServices(e);console.log("Discovered services:",r);for(const n of r)for(const i of n.characteristics)if(i.properties.write||i.properties.writeWithoutResponse){console.log("Found writable characteristic:",{service:n.uuid,characteristic:i.uuid}),this.printerService=n.uuid,this.printerCharacteristic=i.uuid;return}throw new Error("No writable characteristic found on printer")}catch(r){throw console.error("Service discovery error:",r),r}}async connect(e,r){if(this.isWeb)throw new Error("Bluetooth printing not supported in web browser");try{return await c.connect(e,()=>{console.log("Printer disconnected"),this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}),this.device={deviceId:e,name:r||"Thermal Printer"},await this.discoverPrinterCharacteristics(e),localStorage.setItem("thermal_printer_id",e),localStorage.setItem("thermal_printer_name",r||"Thermal Printer"),this.notifyConnectionChange(!0),!0}catch(n){return console.error("Connection error:",n),this.device=null,!1}}async disconnect(){if(this.device&&!this.isWeb){try{await c.disconnect(this.device.deviceId)}catch(e){console.error("Disconnect error:",e)}this.device=null,this.printerService=null,this.printerCharacteristic=null,localStorage.removeItem("thermal_printer_id"),localStorage.removeItem("thermal_printer_name"),this.notifyConnectionChange(!1)}}isConnected(){return this.device!==null&&this.printerService!==null&&this.printerCharacteristic!==null}async autoDetect(){if(!(this.isWeb||this.isConnected()))try{console.log("🔍 [AutoDetect] Scanning for printers (3s)...");const e=[];if(await c.requestLEScan({},n=>{const i=(n.device.name??"").toLowerCase();(i.includes("pt")||i.includes("printer")||i.includes("thermal")||i.includes("pos")||i.includes("rpp")||i.includes("xp")||i.includes("t58")||i.includes("mtp")||i.includes("bt")||i.includes("58mm")||i.includes("80mm"))&&!e.find(s=>s.deviceId===n.device.deviceId)&&(e.push(n.device),console.log("🖨️ [AutoDetect] Printer candidate:",n.device.name))}),await new Promise(n=>setTimeout(n,3e3)),await c.stopLEScan(),e.length===0){console.log("⚠️ [AutoDetect] No printers found during auto-scan.");return}const r=e[0];console.log(`🔗 [AutoDetect] Auto-connecting to ${r.name}...`),await this.connect(r.deviceId,r.name??void 0),console.log("✅ [AutoDetect] Connected to",r.name)}catch(e){console.warn("⚠️ [AutoDetect] Silent failure:",e)}}getConnectedDevice(){return this.device}async write(e){if(!this.device||this.isWeb)throw new Error("Printer not connected");if(!this.printerService||!this.printerCharacteristic)throw new Error("Printer characteristics not discovered. Please reconnect.");const n=new TextEncoder().encode(e),i=new DataView(n.buffer);try{console.log("Writing to printer:",{service:this.printerService,characteristic:this.printerCharacteristic,dataLength:n.length}),await c.write(this.device.deviceId,this.printerService,this.printerCharacteristic,i),console.log("Write successful")}catch(o){throw console.error("Write error:",o),new Error(`Failed to write to printer: ${o.message}`)}}async printTest(){const e=[`${t}@`,`${t}a`,`================================
`,`Sabing2m Test Receipt
`,`================================
`,`${t}a\0`,`Date: ${new Date().toLocaleDateString()}
`,`Time: ${new Date().toLocaleTimeString()}
`,`================================
`,`Bluetooth Connection: OK
`,`Printer Status: Connected
`,`================================
`,`
`,`${a}VA\0`].join("");await this.write(e)}async printTicket(e){console.log("[ThermalPrinter] printTicket() called with data:",e);const r=e.side.toUpperCase(),n=e.event_name||"SABONG EVENT";console.log("[ThermalPrinter] Building ESC/POS commands with QR code..."),console.log("[ThermalPrinter] Event name to print:",n);const i=[`${t}@`,`${t}a`,`${n}
`,`--------------------------------
`,`${t}a\0`,`${a}(k\x001A2\0`,`${a}(k\x001C`,`${a}(k\x001E0`,`${a}(k${String.fromCharCode(e.ticket_id.length+3)}\x001P0${e.ticket_id}`,`${a}(k\x001Q0`,`
`,`${t}a\0`,`#${e.fight_number} | ${e.ticket_id}
`,`${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})} ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0})}
`,`--------------------------------
`,`${t}a`,`${t}!0`,`${r} - P${e.amount.toLocaleString()}
`,`${t}!\0`,`--------------------------------
`,`${t}a`,`OFFICIAL RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",i.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(i),console.log("[ThermalPrinter] ✅ write() completed successfully")}catch(o){throw console.error("[ThermalPrinter] ❌ write() failed:",o),o}}async printPayoutReceipt(e){console.log("[ThermalPrinter] printPayoutReceipt() called with data:",e);const r=e.side.toUpperCase(),n=e.event_name||"SABONG EVENT";console.log("[ThermalPrinter] Building payout receipt ESC/POS commands...");const i=[`${t}@`,`${t}a`,`${t}!`,`${n}
`,`${t}!\0`,`================================
`,`${t}a`,`${t}!\b`,`PAYOUT RECEIPT
`,`${t}!\0`,`================================
`,`${t}a\0`,`Fight#: ${e.fight_number}
`,`Bet By: ${e.bet_by}
`,`Claimed By: ${e.claimed_by}
`,`Receipt: ${e.ticket_id}
`,`Date: ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time: ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`================================
`,`
`,`${t}a\0`,`Side: ${r}
`,`Bet Amount: P${e.bet_amount.toLocaleString()}
`,`Odds: ${e.odds}x
`,`================================
`,`
`,`${t}a`,`${t}!0`,`PAYOUT: P${e.payout_amount.toLocaleString()}
`,`${t}!\0`,`
`,`================================
`,`
`,`${t}a`,`WINNER - CLAIM RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",i.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(i),console.log("[ThermalPrinter] ✅ Payout receipt printed successfully")}catch(o){throw console.error("[ThermalPrinter] ❌ Payout receipt print failed:",o),o}}async printRefundReceipt(e){console.log("[ThermalPrinter] printRefundReceipt() called with data:",e);const r=e.side.toUpperCase(),n=e.event_name||"SABONG EVENT",i=e.refund_reason||"DRAW";console.log("[ThermalPrinter] Building refund receipt ESC/POS commands...");const o=[`${t}@`,`${t}a`,`${t}!`,`${n}
`,`${t}!\0`,`================================
`,`${t}a`,`${t}!\b`,`REFUND RECEIPT
`,`${t}!\0`,`Reason: ${i}
`,`================================
`,`${t}a\0`,`Fight#: ${e.fight_number}
`,`Bet By: ${e.bet_by}
`,`Refunded By: ${e.claimed_by}
`,`Receipt: ${e.ticket_id}
`,`Date: ${new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
`,`Time: ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}
`,`================================
`,`
`,`${t}a\0`,`Side: ${r}
`,`Bet Amount: P${e.bet_amount.toLocaleString()}
`,`================================
`,`
`,`${t}a`,`${t}!0`,`REFUND: P${e.refund_amount.toLocaleString()}
`,`${t}!\0`,`
`,`================================
`,`
`,`${t}a`,`${i} - REFUND RECEIPT
`,`
`,`${a}VA\0`].join("");console.log("[ThermalPrinter] Commands built, length:",o.length),console.log("[ThermalPrinter] Calling write()...");try{await this.write(o),console.log("[ThermalPrinter] ✅ Refund receipt printed successfully")}catch(s){throw console.error("[ThermalPrinter] ❌ Refund receipt print failed:",s),s}}}const C=new d;export{C as t};
