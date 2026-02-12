import{r as l,b as g,j as e,H as x}from"./app-lGPzA6e3.js";import"./app-DkS3MTni.js";function j(){const[t,m]=l.useState(null),[u,o]=l.useState(!0),[h,d]=l.useState(!1),[i,f]=l.useState(void 0);l.useEffect(()=>{c();const s=setInterval(c,2e3);return()=>clearInterval(s)},[]);const c=async()=>{try{const a=(await g.get("/api/bigscreen")).data.fight;a&&a.status==="declared"&&(!t||t.status!=="declared"||t.result!==a.result)&&(d(!0),f(t?.result),setTimeout(()=>d(!1),1e4)),m(a),o(!1)}catch(s){console.error("Error fetching fight data:",s),o(!1)}};if(u)return e.jsx("div",{className:"min-h-screen bg-black flex items-center justify-center",children:e.jsx("div",{className:"text-white text-4xl",children:"Loading..."})});if(!t)return e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center",children:[e.jsx(x,{title:"Big Screen - Sabing2m"}),e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-6xl font-bold text-white mb-4",children:"Sabing2m"}),e.jsx("p",{className:"text-3xl text-gray-400",children:"No Active Fight"}),e.jsx("p",{className:"text-xl text-gray-500 mt-4",children:"Please wait for the next fight..."})]})]});const r=t.total_pot>0?t.meron_total/t.total_pot*100:0,n=t.total_pot>0?t.wala_total/t.total_pot*100:0,p=()=>{switch(t.status){case"open":return"bg-green-600";case"lastcall":return"bg-yellow-600 animate-pulse";case"declared":return"bg-purple-600";default:return"bg-gray-600"}},b=()=>{switch(t.status){case"open":return"BETTING OPEN";case"lastcall":return"LAST CALL!";case"declared":return"RESULT DECLARED";default:return t.status.toUpperCase().replace("_"," ")}};return e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6",children:[e.jsx(x,{title:`Fight #${t.fight_number} - Big Screen`}),e.jsxs("div",{className:"mb-6",children:[e.jsxs("div",{className:"flex justify-between items-start mb-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-5xl font-bold text-orange-500 mb-2",children:t.event_name||"Sabing2m Championship"}),t.venue&&e.jsxs("p",{className:"text-2xl text-gray-400",children:["📍 ",t.venue]}),t.round_number&&e.jsxs("p",{className:"text-xl text-gray-400",children:["Round ",t.round_number]})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"text-7xl font-bold text-orange-500",children:["FIGHT #",t.fight_number]}),t.match_type&&t.match_type!=="regular"&&e.jsx("div",{className:"bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-2 rounded-full text-2xl font-bold mt-2 inline-block",children:t.match_type.toUpperCase()})]})]}),e.jsx("div",{className:`${p()} px-8 py-4 rounded-lg text-center`,children:e.jsx("div",{className:"text-4xl font-bold tracking-wider",children:b()})})]}),(t.notes||t.special_conditions)&&e.jsxs("div",{className:"bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 mb-6 border-2 border-indigo-500/30",children:[t.notes&&e.jsxs("div",{className:"mb-3",children:[e.jsx("div",{className:"text-xl font-bold text-indigo-300 mb-2",children:"📝 Fight Notes:"}),e.jsx("div",{className:"text-2xl text-white",children:t.notes})]}),t.special_conditions&&e.jsxs("div",{children:[e.jsx("div",{className:"text-xl font-bold text-yellow-300 mb-2",children:"⚠️ Special Conditions:"}),e.jsx("div",{className:"text-2xl text-white",children:t.special_conditions})]})]}),h&&t.result&&e.jsxs("div",{className:"fixed inset-0 bg-gradient-to-br from-black via-purple-900/30 to-black flex items-center justify-center z-50 overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 pointer-events-none overflow-hidden",children:[...Array(50)].map((s,a)=>e.jsx("div",{className:"absolute animate-confetti",style:{left:`${Math.random()*100}%`,top:"-100px",animationDelay:`${Math.random()*3}s`,animationDuration:`${2+Math.random()*3}s`,fontSize:`${30+Math.random()*40}px`},children:e.jsx("span",{children:["🎊","🎉","✨","🏆","⭐","👏","🎇","🎆","💫","🌟"][Math.floor(Math.random()*10)]})},`confetti-${a}`))}),e.jsx("div",{className:"absolute inset-0 pointer-events-none",children:[...Array(8)].map((s,a)=>e.jsx("div",{className:"absolute animate-firework",style:{left:`${10+Math.random()*80}%`,top:`${10+Math.random()*60}%`,animationDelay:`${a*.5}s`},children:e.jsx("div",{className:`text-6xl ${t.result==="meron"?"text-red-500":"text-blue-500"}`,children:"💥"})},`firework-${a}`))}),e.jsx("div",{className:"absolute inset-0 pointer-events-none",children:[...Array(30)].map((s,a)=>e.jsx("div",{className:"absolute animate-sparkle",style:{left:`${20+Math.random()*60}%`,top:`${20+Math.random()*60}%`,animationDelay:`${Math.random()*2}s`,animationDuration:`${1+Math.random()}s`},children:e.jsx("span",{className:"text-yellow-300 text-4xl",children:"✨"})},`sparkle-${a}`))}),e.jsx("div",{className:"absolute inset-0 pointer-events-none",children:[...Array(20)].map((s,a)=>e.jsx("div",{className:"absolute animate-float",style:{left:`${Math.random()*100}%`,top:`${100+Math.random()*20}%`,animationDelay:`${Math.random()*2}s`,animationDuration:`${4+Math.random()*3}s`},children:e.jsx("span",{className:"text-5xl",children:["🐓","🏆","👑","💰","🎯"][Math.floor(Math.random()*5)]})},`float-${a}`))}),e.jsxs("div",{className:"text-center relative z-10",children:[i&&i!==t.result&&e.jsxs("div",{className:"mb-8 animate-pulse-fast",children:[e.jsx("div",{className:"text-6xl font-black text-yellow-400 drop-shadow-2xl animate-shake",children:"⚠️ RESULT UPDATED! ⚠️"}),e.jsxs("div",{className:"text-3xl text-yellow-300 mt-2",children:["Previous: ",i.toUpperCase()," → New: ",t.result?.toUpperCase()]})]}),e.jsxs("div",{className:"relative mb-10",children:[e.jsx("div",{className:"absolute inset-0 blur-3xl opacity-60",children:e.jsxs("div",{className:`text-9xl font-black ${t.result==="meron"?"text-red-500":t.result==="wala"?"text-blue-500":"text-green-500"}`,children:[t.result==="meron"&&"MERON WINS!",t.result==="wala"&&"WALA WINS!",t.result==="draw"&&"DRAW!"]})}),e.jsxs("div",{className:"relative text-9xl font-black mb-8 animate-bounce-slow drop-shadow-2xl",children:[t.result==="meron"&&e.jsx("span",{className:"text-red-500 animate-glow-intense animate-scale-pulse",children:"MERON WINS! 🏆"}),t.result==="wala"&&e.jsx("span",{className:"text-blue-500 animate-glow-intense animate-scale-pulse",children:"WALA WINS! 🏆"}),t.result==="draw"&&e.jsx("span",{className:"text-green-500 animate-glow-intense animate-scale-pulse",children:"DRAW! 🤝"}),t.result==="cancelled"&&e.jsx("span",{className:"text-gray-500 animate-fade-in-out",children:"FIGHT CANCELLED ❌"})]})]}),t.result!=="cancelled"&&t.result!=="draw"&&e.jsxs("div",{className:"relative mb-8",children:[e.jsx("div",{className:"absolute inset-0 blur-2xl opacity-40",children:e.jsx("div",{className:"text-8xl font-bold text-white",children:t.result==="meron"?t.meron_fighter:t.wala_fighter})}),e.jsxs("div",{className:"relative text-8xl font-bold text-white drop-shadow-lg animate-slide-up",children:["👑 ",t.result==="meron"?t.meron_fighter:t.wala_fighter," 👑"]})]}),t.result!=="cancelled"&&e.jsxs("div",{className:"bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-3xl p-8 animate-pulse-glow",children:[e.jsx("div",{className:"text-3xl font-bold mb-2",children:"💰 TOTAL POT 💰"}),e.jsxs("div",{className:"text-7xl font-black text-white drop-shadow-lg",children:["₱",t.total_pot.toLocaleString()]})]}),e.jsx("div",{className:"mt-8 text-4xl font-bold text-white animate-bounce-slow",children:"🎊 CONGRATULATIONS! 🎊"})]})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-6 mb-6",children:[e.jsxs("div",{className:`bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-8 relative transform transition-all duration-300 ${!t.meron_betting_open&&t.status!=="declared"?"opacity-60 scale-95":"scale-100"}`,children:[!t.meron_betting_open&&t.status!=="declared"&&e.jsx("div",{className:"absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm font-bold animate-pulse",children:"🔒 CLOSED"}),e.jsx("div",{className:"text-3xl font-bold mb-4",children:"MERON"}),e.jsx("div",{className:"text-7xl font-black mb-6 truncate",children:t.meron_fighter}),e.jsxs("div",{className:"bg-red-900/50 rounded-xl p-4 mb-4",children:[e.jsx("div",{className:"text-lg mb-2",children:"ODDS"}),e.jsxs("div",{className:"text-8xl font-bold",children:[Number(t.meron_odds).toFixed(2),"x"]})]}),e.jsxs("div",{className:"bg-red-900/50 rounded-xl p-4 mb-3",children:[e.jsx("div",{className:"text-lg mb-2",children:"TOTAL BETS"}),e.jsxs("div",{className:"text-6xl font-bold",children:["₱",t.meron_total.toLocaleString()]}),e.jsxs("div",{className:"text-xl mt-2 text-red-200",children:[r.toFixed(1),"% of pot"]})]}),e.jsxs("div",{className:"bg-red-900/50 rounded-xl p-3 text-center",children:[e.jsx("div",{className:"text-3xl font-bold",children:t.meron_count||0}),e.jsx("div",{className:"text-sm text-red-200",children:"BETS PLACED"})]})]}),e.jsx("div",{className:"bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 flex flex-col justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold mb-4",children:"DRAW"}),e.jsxs("div",{className:"bg-green-900/50 rounded-xl p-6 mb-4",children:[e.jsx("div",{className:"text-lg mb-2",children:"ODDS"}),e.jsxs("div",{className:"text-9xl font-bold",children:[Number(t.draw_odds).toFixed(2),"x"]})]}),e.jsxs("div",{className:"bg-green-900/50 rounded-xl p-4 mb-3",children:[e.jsx("div",{className:"text-lg mb-2",children:"TOTAL"}),e.jsxs("div",{className:"text-5xl font-bold",children:["₱",t.draw_total.toLocaleString()]})]}),e.jsxs("div",{className:"bg-green-900/50 rounded-xl p-3",children:[e.jsx("div",{className:"text-2xl font-bold",children:t.draw_count||0}),e.jsx("div",{className:"text-sm text-green-200",children:"BETS"})]})]})}),e.jsxs("div",{className:`bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 relative transform transition-all duration-300 ${!t.wala_betting_open&&t.status!=="declared"?"opacity-60 scale-95":"scale-100"}`,children:[!t.wala_betting_open&&t.status!=="declared"&&e.jsx("div",{className:"absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm font-bold animate-pulse",children:"🔒 CLOSED"}),e.jsx("div",{className:"text-3xl font-bold mb-4",children:"WALA"}),e.jsx("div",{className:"text-7xl font-black mb-6 truncate",children:t.wala_fighter}),e.jsxs("div",{className:"bg-blue-900/50 rounded-xl p-4 mb-4",children:[e.jsx("div",{className:"text-lg mb-2",children:"ODDS"}),e.jsxs("div",{className:"text-8xl font-bold",children:[Number(t.wala_odds).toFixed(2),"x"]})]}),e.jsxs("div",{className:"bg-blue-900/50 rounded-xl p-4 mb-3",children:[e.jsx("div",{className:"text-lg mb-2",children:"TOTAL BETS"}),e.jsxs("div",{className:"text-6xl font-bold",children:["₱",t.wala_total.toLocaleString()]}),e.jsxs("div",{className:"text-xl mt-2 text-blue-200",children:[n.toFixed(1),"% of pot"]})]}),e.jsxs("div",{className:"bg-blue-900/50 rounded-xl p-3 text-center",children:[e.jsx("div",{className:"text-3xl font-bold",children:t.wala_count||0}),e.jsx("div",{className:"text-sm text-blue-200",children:"BETS PLACED"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-6 mb-6",children:[e.jsxs("div",{className:"bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 rounded-2xl p-6 text-center",children:[e.jsx("div",{className:"text-2xl font-bold mb-2",children:"TOTAL POT"}),e.jsxs("div",{className:"text-7xl font-black",children:["₱",t.total_pot.toLocaleString()]})]}),e.jsxs("div",{className:"bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 rounded-2xl p-6 text-center",children:[e.jsxs("div",{className:"text-2xl font-bold mb-2",children:["COMMISSION (",t.commission_percentage||0,"%)"]}),e.jsxs("div",{className:"text-7xl font-black",children:["₱",t.commission?.toLocaleString()||0]})]}),e.jsxs("div",{className:"bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 rounded-2xl p-6 text-center",children:[e.jsx("div",{className:"text-2xl font-bold mb-2",children:"NET POT"}),e.jsxs("div",{className:"text-7xl font-black",children:["₱",t.net_pot?.toLocaleString()||0]})]})]}),e.jsx("div",{className:"bg-gray-800 rounded-full p-2 shadow-2xl",children:e.jsxs("div",{className:"h-16 rounded-full overflow-hidden flex relative",children:[e.jsx("div",{className:"bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center text-2xl font-bold transition-all duration-500 ease-out",style:{width:`${r}%`},children:r>15&&`${r.toFixed(0)}%`}),e.jsx("div",{className:"bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center text-xl font-bold transition-all duration-500 ease-out",style:{width:`${t.draw_total>0?t.draw_total/t.total_pot*100:0}%`},children:t.draw_total>0&&t.total_pot>0&&t.draw_total/t.total_pot*100>5&&"DRAW"}),e.jsx("div",{className:"bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-2xl font-bold transition-all duration-500 ease-out",style:{width:`${n}%`},children:n>15&&`${n.toFixed(0)}%`})]})}),e.jsx("div",{className:"mt-6 text-center",children:e.jsxs("div",{className:"inline-flex items-center gap-2 bg-gray-800/50 px-6 py-3 rounded-full",children:[e.jsx("div",{className:"w-3 h-3 bg-green-500 rounded-full animate-pulse"}),e.jsx("span",{className:"text-lg text-gray-300",children:"LIVE - Updating every 2 seconds"})]})}),e.jsx("style",{children:`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                @keyframes glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 20px currentColor);
                    }
                    50% {
                        filter: drop-shadow(0 0 40px currentColor) drop-shadow(0 0 60px currentColor);
                    }
                }

                @keyframes glow-intense {
                    0%, 100% {
                        filter: drop-shadow(0 0 30px currentColor) drop-shadow(0 0 50px currentColor);
                        text-shadow: 0 0 40px currentColor, 0 0 80px currentColor;
                    }
                    50% {
                        filter: drop-shadow(0 0 60px currentColor) drop-shadow(0 0 100px currentColor);
                        text-shadow: 0 0 80px currentColor, 0 0 120px currentColor;
                    }
                }

                @keyframes firework {
                    0% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                }

                @keyframes float {
                    0% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-120vh);
                        opacity: 0;
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-30px);
                    }
                }

                @keyframes scale-pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }

                @keyframes slide-up {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(234, 179, 8, 0.8), 0 0 80px rgba(234, 179, 8, 0.5);
                    }
                }

                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                @keyframes fade-in-out {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                
                .animate-confetti {
                    animation: confetti linear infinite;
                }
                
                .animate-glow {
                    animation: glow 1.5s ease-in-out infinite;
                }

                .animate-glow-intense {
                    animation: glow-intense 2s ease-in-out infinite;
                }

                .animate-firework {
                    animation: firework 2s ease-in-out infinite;
                }

                .animate-sparkle {
                    animation: sparkle 1.5s ease-in-out infinite;
                }

                .animate-float {
                    animation: float linear infinite;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .animate-scale-pulse {
                    animation: scale-pulse 1s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out infinite;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                }

                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                .animate-pulse-fast {
                    animation: pulse-fast 0.5s ease-in-out infinite;
                }

                .animate-fade-in-out {
                    animation: fade-in-out 2s ease-in-out infinite;
                }
            `})]})}export{j as default};
