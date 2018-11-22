// ==UserScript==
// @name         Krunker.io Hack
// @description  Krunker.io Hack
// @updateURL    https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @downloadURL  https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @version      3.0
// @author       Faber, collaborators: William Thomson, Tehchy
// @include      /^https?:\/\/krunker\.io(|\/|\/\?server=.+)$/
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

window.stop()
document.innerHTML = ""

class Hack {
    constructor() {
        this.camera = null
        this.inputs = null
        this.game = null
        this.fps = 0
        this.fpsTimes = []
        this.fpsCounter = null
        this.canvas = null
        this.ctx = null
        this.hooks = {
            entities: [],
            world: null,
            context: null,
            config: null
        }
        this.colors = ['Green', 'Orange', 'DodgerBlue', 'Black', 'Red'];
        this.settings = {
            esp: 1,
            espColor: 0,
            bhop: 0,
            bhopHeld: false,
            fpsCounter: true,
            autoAim: 3,
            autoAimWalls: false,
            autoAimRange: 'Default',
            aimSettings: true,
            noRecoil: true,
            tracers: true,
            autoRespawn: false,
            autoSwap: false,
        }
        this.settingsMenu = [];
        this.aimbot = {
            initialized: false
        }
        this.flag = new Image()
        this.flag.src = "./textures/objective_1.png"
        this.onLoad()
    }

    getDistance3D(x1, y1, z1, x2, y2, z2) {
        const dx = x1 - x2
        const dy = y1 - y2
        const dz = z1 - z2
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    createCanvas() {
        const hookedCanvas = document.createElement("canvas")
        hookedCanvas.width = innerWidth
        hookedCanvas.height = innerHeight
        window.addEventListener('resize', () => {
            hookedCanvas.width = innerWidth
            hookedCanvas.height = innerHeight
        });
        this.canvas = hookedCanvas
        this.ctx = hookedCanvas.getContext("2d")
        const hookedUI = document.getElementById("inGameUI")
        hookedUI.insertAdjacentElement("beforeend", hookedCanvas)
        requestAnimationFrame(this.render.bind(this))
    }

    createFPSCounter() {
        if (!this.settings.fpsCounter) return
        const el = document.createElement("div")
        el.id = "fpsCounter"
        el.style.position = "absolute"
        el.style.color = "white"
        el.style.top = "0.4em"
        el.style.left = "20px"
        el.style.fontSize = "smaller"
        el.innerHTML = `FPS: ${this.fps}`
        this.fpsCounter = el
        const ui = document.getElementById("gameUI")
        ui.appendChild(el, ui)
    }

    createMenu() {
        const rh = document.getElementById('rightHolder');
        rh.insertAdjacentHTML("beforeend", "<br/><a href='javascript:;' onmouseover=\"SOUND.play('tick_0',0.1)\" onclick='showWindow(window.windows.length);' class=\"menuLink\">Hacks</a>")
        let self = this
        this.settingsMenu = {
            fpsCounter: {
                name: "Show FPS",
                pre: "<div class='setHed'><center>Hack Settings</center></div><div class='setHed'>Render</div>",
                val: 1,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("fpsCounter", this.checked)' ${self.settingsMenu["fpsCounter"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.fpsCounter = t;
                }
            }, esp: {
                name: "Player ESP",
                val: 1,
                html() {
                    return `<select onchange="window.hack.setSetting('esp', this.value)"><option value="0"${self.settingsMenu["esp"].val == 0 ? " selected" : ""}>Disabled</option><option value="1"${self.settingsMenu["esp"].val == 1 ? " selected" : ""}>Full</option><option value="2"${self.settingsMenu["esp"].val == 2 ? " selected" : ""}>Outline Only</option></select>`
                },
                set(t) {
                    self.settings.esp = parseInt(t)
                }
            }, espColor: {
                name: "Player ESP Color",
                val: 0,
                html() {
                    return `<select onchange="window.hack.setSetting('espColor', this.value)"><option value="0"${self.settingsMenu["espColor"].val == 0 ? " selected" : ""}>Green</option><option value="1"${self.settingsMenu["espColor"].val == 1 ? " selected" : ""}>Orange</option><option value="2"${self.settingsMenu["espColor"].val == 2 ? " selected" : ""}>DodgerBlue</option><option value="3"${self.settingsMenu["espColor"].val == 3 ? " selected" : ""}>Black</option><option value="4"${self.settingsMenu["espColor"].val == 4 ? " selected" : ""}>Red</option></select>`
                },
                set(t) {
                    self.settings.espColor = parseInt(t)
                }
            }, tracers: {
                name: "Player Tracers",
                val: 1,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("tracers", this.checked)' ${self.settingsMenu["tracers"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.tracers = t;
                }
            }, bhop: {
                name: "BHop",
                pre: "<div class='setHed'>Movement</div>",
                val: 0,
                html() {
                    return `<select onchange="window.hack.setSetting('bhop', this.value)"><option value="0"${self.settingsMenu["bhop"].val == 0 ? " selected" : ""}>Off</option><option value="1"${self.settingsMenu["bhop"].val == 1 ? " selected" : ""}>Automatic</option><option value="2"${self.settingsMenu["bhop"].val == 2 ? " selected" : ""}>Manual</option></select>`
                },
                set(t) {
                    self.settings.bhop = parseInt(t)
                }
            }, noRecoil: {
                name: "No Recoil",
                pre: "<div class='setHed'>Combat</div>",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("noRecoil", this.checked)' ${self.settingsMenu["noRecoil"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.noRecoil = t
                }
            }, autoAim: {
                name: "Auto Aim",
                val: 3,
                html() {
                    return `<select onchange="window.hack.setSetting('autoAim', this.value)"><option value="0"${self.settingsMenu["autoAim"].val == 0 ? " selected" : ""}>Off</option><option value="1"${self.settingsMenu["autoAim"].val == 1 ? " selected" : ""}>TriggerBot</option><option value="2"${self.settingsMenu["autoAim"].val == 2 ? " selected" : ""}>Quickscoper</option><option value="3"${self.settingsMenu["autoAim"].val == 3 ? " selected" : ""}>Manual</option><option value="4"${self.settingsMenu["autoAim"].val == 4 ? " selected" : ""}>Hip Fire</option></select>`
                },
                set(t) {
                    self.settings.autoAim = parseInt(t)
                }
            }, autoAimRange: {
                name: "Auto Aim Range",
                val: 'Default',
                html() {
                    return `<select onchange="window.hack.setSetting('autoAimRange', this.value)"> 
                    <option${self.settingsMenu["autoAimRange"].val == 'Default' ? " selected" : ""}>Default</option>
                    <option${self.settingsMenu["autoAimRange"].val == '100' ? " selected" : ""}>100</option>
                    <option${self.settingsMenu["autoAimRange"].val == '150' ? " selected" : ""}>150</option>
                    <option${self.settingsMenu["autoAimRange"].val == '200' ? " selected" : ""}>200</option>
                    <option${self.settingsMenu["autoAimRange"].val == '250' ? " selected" : ""}>250</option>
                    <option${self.settingsMenu["autoAimRange"].val == '300' ? " selected" : ""}>300</option>
                    <option${self.settingsMenu["autoAimRange"].val == '350' ? " selected" : ""}>350</option>
                    <option${self.settingsMenu["autoAimRange"].val == '400' ? " selected" : ""}>400</option>
                    <option${self.settingsMenu["autoAimRange"].val == '450' ? " selected" : ""}>450</option>
                    <option${self.settingsMenu["autoAimRange"].val == '500' ? " selected" : ""}>500</option>
                    <option${self.settingsMenu["autoAimRange"].val == '750' ? " selected" : ""}>750</option>
                    <option${self.settingsMenu["autoAimRange"].val == '1000' ? " selected" : ""}>1000</option>
                    </select>`
                },
                set(t) {
                    self.settings.autoAimRange = t
                }
            }, autoAimWalls: {
                name: "Aim Through Walls",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("autoAimWalls", this.checked);' ${self.settingsMenu["autoAim"].val ? (self.settingsMenu["autoAimWalls"].val ? "checked" : "") : "disabled"}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.autoAimWalls = t;
                }
            }, aimSettings: {
                name: "Custom Aim Settings",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("aimSettings", this.checked)' ${self.settingsMenu["aimSettings"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.aimSettings = t;
                    self.changeSettings();
                }
            }, autoRespawn: {
                name: "Auto Respawn",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("autoRespawn", this.checked)' ${self.settingsMenu["autoRespawn"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.autoRespawn = t;
                }
            }, autoSwap: {
                name: "Auto Weapon Swap",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.hack.setSetting("autoSwap", this.checked)' ${self.settingsMenu["autoSwap"].val ? "checked" : ""}><span class='slider'></span></label>`
                },
                set(t) {
                    self.settings.autoSwap = t;
                }
            }
        };
    }

    setupSettings() {
        for (var key in this.settingsMenu)
            if (this.settingsMenu[key].set) {
                const nt = this.getSavedVal(`kro_set_hack_${key}`);
                this.settingsMenu[key].val = null !== nt ? nt : this.settingsMenu[key].val,
                    "false" == this.settingsMenu[key].val && (this.settingsMenu[key].val = !1),
                    this.settingsMenu[key].set(this.settingsMenu[key].val, !0)
            }
    }

    keyDown(event) {
        if (document.activeElement.id == 'chatInput') return;
        switch (event.key.toUpperCase()) {
            case 'B':
                this.settings.bhop++;
                if (this.settings.bhop > 2) this.settings.bhop = 0
                this.setSetting('bhop', this.settings.bhop);
                var n = this.settings.bhop == 0 ? 'Disabled' : (this.settings.bhop == 2 ? 'Manual' : 'Automatic');
                this.chatMessage(null, `<span style='color:#fff'>BHop - </span> <span style='color:${this.settings.bhop > 0 ? 'green' : 'red'}'>${n}</span>`, !0)
                break;

            case 'T':
                this.settings.autoAim++;
                if (this.settings.autoAim > 4) this.settings.autoAim = 0
                this.setSetting('autoAim', this.settings.autoAim);
                var n = this.settings.autoAim == 0 ? 'Disabled' : (this.settings.autoAim == 4 ? 'Hip Fire' : (this.settings.autoAim == 3 ? 'Manual' : (this.settings.autoAim == 2 ? 'Quickscoper' : 'TriggerBot')));
                this.chatMessage(null, `<span style='color:#fff'>AutoAim - </span> <span style='color:${this.settings.autoAim > 0 ? 'green' : 'red'}'>${n}</span>`, !0)
                break;

           case 'Y':
                this.settings.esp++;
                if (this.settings.esp > 2) this.settings.esp = 0
                this.setSetting('esp', this.settings.esp);
                var n = this.settings.esp == 0 ? 'Disabled' : (this.settings.esp == 2 ? 'Outline Only' : 'Full');
                this.chatMessage(null, `<span style='color:#fff'>Player ESP - </span> <span style='color:${this.settings.esp > 0 ? 'green' : 'red'}'>${n}</span>`, !0)
                break;

           case 'U':
                this.settings.espColor++;
                if (this.settings.espColor > 4) this.settings.espColor = 0
                this.setSetting('espColor', this.settings.espColor);
                var n = this.colors[this.settings.espColor];
                this.chatMessage(null, `<span style='color:#fff'>Player ESP Color - </span> <span style='color:${n.toLowerCase()}'>${n}</span>`, !0)
                break;

            case ' ':
                if (this.settings.bhop !== 2) return;
                this.settings.bhopHeld = true;
                break;
        }
    }

    keyUp(event) {
        if (document.activeElement.id == 'chatInput') return;
        switch (event.key.toUpperCase()) {
            case ' ':
                if (this.settings.bhop !== 2) return;
                this.settings.bhopHeld = false;
                break;
        }
    }

    chatMessage(t, e, n) {
        const chatList = document.getElementById('chatList');
        for (chatList.innerHTML += n ? `<div class='chatItem'><span class='chatMsg'>${e}</span></div><br/>` : `<div class='chatItem'>${t || "unknown"}: <span class='chatMsg'>${e}</span></div><br/>`; chatList.scrollHeight >= 250;)
            chatList.removeChild(chatList.childNodes[0])
    }

    drawText(txt, font, color, x, y) {
        this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.beginPath()
        this.ctx.fillStyle = color
        this.ctx.font = font
        this.ctx.fillText(txt, 0, 0)
        this.ctx.closePath()
        this.ctx.restore()
    }

    getMyself() {
        return this.hooks.entities.find(x => x.isYou)
    }

    randFloat(t, e) {
        return t + Math.random() * (e - t)
    }

    getDirection(t, e, n, r) {
        return Math.atan2(e - r, t - n)
    }

    getXDir(e, n, r, i, a, s) {
        const o = Math.abs(n - a)
        const c = this.getDistance3D(e, n, r, i, a, s)
        return Math.asin(o / c) * (n > a ? -1 : 1)
    }

    getAngleDist(t, e) {
        return Math.atan2(Math.sin(e - t), Math.cos(t - e))
    }

    getTarget() {
        let target = null
        let bestDist = this.getRange()
        for (const player of this.hooks.entities.filter(x => !x.isYou)) {
            if ((player.notObst || this.settings.autoAimWalls) && player.active) {
                if (this.me.team && this.me.team === player.team) continue
                let dist = this.getDistance3D(this.me.x, this.me.y, this.me.z, player.x, player.y, player.z)
                if (dist < bestDist) {
                    bestDist = dist
                    target = player
                }
            }
        }
        return target
    }

    getDistFromPlayer(player) {
        return Math.floor(this.me ? this.getDistance3D(this.me.x, this.me.y, this.me.z, player.x, player.y, player.z) : 0)
    }

    getRange() {
        if (this.settings.autoAimRange != 'Default') return parseInt(this.settings.autoAimRange)
        if (this.me.weapon.range) return this.me.weapon.range + 25
        return 9999
    }

    drawESP() {
        for (const entity of this.hooks.entities.filter(x => !x.isYou)) {
            if (entity.active) {
                const me = this.hooks.world.camera.getWorldPosition()
                const target = entity.objInstances.position.clone()
                const dist = 1 - this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z) / 600
                if (20 * dist >= 1 && this.hooks.world.frustum.containsPoint(target)) {
                    const scale = Math.max(.1, 1 - this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z) / 600)
                    const targetX = entity.hookedX
                    const targetY = entity.hookedY + 60 * scale
                    const offsetX = 80
                    const offsetY = 180
                    const color = this.colors[this.settings.espColor]
                    
                    if (this.settings.esp > 0) {
                        this.ctx.strokeStyle = entity.team === null ? "red" : this.getMyself().team === entity.team ? "green" : "red"
                        this.ctx.save()
                        this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                        this.ctx.beginPath()
                        this.ctx.fillStyle = "red"
                        this.ctx.rect(0, 0, 20 * scale, offsetY * scale)
                        this.ctx.stroke()
                        this.ctx.closePath()
                        this.ctx.restore()

                        this.ctx.save()
                        this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                        this.ctx.beginPath()
                        this.ctx.fillStyle = "green"
                        this.ctx.rect(0, 0, 20 * scale, offsetY * scale)
                        this.ctx.fill()
                        this.ctx.closePath()
                        this.ctx.restore()

                        this.ctx.save()
                        this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                        this.ctx.beginPath()
                        this.ctx.fillStyle = "red"
                        this.ctx.rect(0, 0, 20 * scale, (entity.maxHealth - entity.health) / entity.maxHealth * offsetY * scale)
                        this.ctx.fill()
                        this.ctx.closePath()
                        this.ctx.restore()

                        this.ctx.save()
                        this.ctx.translate(targetX - (offsetX * scale / 2), targetY - (offsetY * scale / 2))
                        this.ctx.beginPath()
                        this.ctx.fillStyle = "red"
                        this.ctx.rect(0, 0, offsetX * scale, offsetY * scale)
                        this.ctx.stroke()
                        this.ctx.closePath()
                        this.ctx.restore()
                        
                        if (this.settings.esp == 1) {
                            const fontSize = 26 * scale > 13 ? 13 : 26 * scale
                            this.drawText(`Name: ${entity.name}`, `${fontSize}px`, color, targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2))
                            this.drawText(`Distance: ${~~this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z)}`, `${fontSize}px`, color, targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 10)
                            this.drawText(`Health: ${entity.health}/${entity.maxHealth}`, `${fontSize}px`, color, targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 20)
                            this.drawText(`Weapon: ${entity.weapon.name}`, `${fontSize}px`, color, targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 30)
                            if (entity.weapon.ammo) {
                                this.drawText(`Ammo: ${entity.ammos[entity.weaponIndex]} / ${entity.weapon.ammo}`, `${fontSize}px`, color, targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 40)
                            }
                        }
                    }

                    if (this.settings.tracers) {
                        this.ctx.save()
                        this.ctx.lineWidth = 2
                        this.ctx.beginPath()
                        this.ctx.strokeStyle = entity.team === null ? "red" : this.getMyself().team === entity.team ? "green" : "red"
                        this.ctx.moveTo(innerWidth / 2, innerHeight - 1)
                        this.ctx.lineTo(targetX, targetY)
                        this.ctx.stroke()
                        this.ctx.restore()
                    }
                }
            }
        }
    }

    drawFPS() {
        if (!this.settings.fpsCounter) {
            if (this.fpsCounter.innerHTML.length > 0) {
                this.fpsCounter.innerHTML = '';
            }
            return;
        }
        const now = performance.now()
        for (; this.fpsTimes.length > 0 && this.fpsTimes[0] <= now - 1e3;) this.fpsTimes.shift()
        this.fpsTimes.push(now)
        this.fps = this.fpsTimes.length
        this.fpsCounter.innerHTML = `FPS: ${this.fps}`
        this.fpsCounter.style.color = this.fps > 50 ? 'green' : (this.fps < 30 ? 'red' : 'orange')
    }
    
    drawFlag() {
        if (window.objectiveIcon && window.objectiveIcon.style.display === "inline-block") {
            this.ctx.save()
            this.ctx.translate(parseFloat(window.objectiveIcon.style.left) / 100 * innerWidth, parseFloat(window.objectiveIcon.style.top) / 100 * innerHeight)
            this.ctx.beginPath()
            this.ctx.drawImage(this.flag, 0, 0, parseFloat(window.objectiveIcon.style.width), parseFloat(window.objectiveIcon.style.height))
            this.ctx.closePath()
            this.ctx.restore()
        }
    }

    bhop() {
        if (this.settings.bhop === 0) return
        if ((this.settings.bhop === 1 && this.camera.keys && this.camera.moveDir !== null) || (this.settings.bhop === 2 && this.settings.bhopHeld)) this.camera.keys[this.camera.jumpKey] = !this.camera.keys[this.camera.jumpKey]
    }

    noRecoil() {
        if (!this.settings.noRecoil) return;
        this.inputs[3] = ((this.camera.pitchObject.rotation.x - this.me.recoilAnimY * this.hooks.config.recoilMlt) % Math.PI2).round(3);
        this.me.recoilAnimYOld = this.me.recoilAnimY;
        this.me.recoilAnimY = 0;
    }

    autoRespawn() {
        if (!this.settings.autoRespawn) return
        if (this.me && this.me.y == undefined && !document.pointerLockElement) this.camera.toggle(true)
    }

    autoSwap() {
        if (!this.settings.autoSwap || !this.me.weapon.ammo || this.me.ammos.length < 2) return
        if (this.me.ammos[this.me.weaponIndex] == 0 && this.me.ammos[0] != this.me.ammos[1])
        {
            this.inputs[10] = 1;
        }
    }

    initAimbot() {
        let self = this
        this.initialized = true
        this.changeSettings()
        this.camera.camLookAt = function(x, y, z) {
            if (!x) return void(this.aimTarget = null)
            const a = self.getXDir(this.object.position.x, this.object.position.y, this.object.position.z, x, y, z)
            const h = self.getDirection(this.object.position.z, this.object.position.x, z, x)
            this.aimTarget = {
                xD: a,
                yD: h,
                x: x + self.hooks.config.camChaseDst * Math.sin(h) * Math.cos(a),
                y: y - self.hooks.config.camChaseDst * Math.sin(a),
                z: z + self.hooks.config.camChaseDst * Math.cos(h) * Math.cos(a)
            }
        }
        this.camera.updateOld = this.camera.update
        this.camera.update = function() {
            if (!this.target && this.aimTarget) {
                if (self.settings.autoAim > 0) {
                    this.object.rotation.y = this.aimTarget.yD
                    this.pitchObject.rotation.x = this.aimTarget.xD
                }
                const c = Math.PI / 2
                this.pitchObject.rotation.x = Math.max(-c, Math.min(c, this.pitchObject.rotation.x))
                this.yDr = (this.pitchObject.rotation.x % Math.PI2).round(3)
                this.xDr = (this.object.rotation.y % Math.PI2).round(3)
            }
            let ret = this.updateOld(...arguments)
            return ret
        }
        this.camera.resetOld = this.camera.reset
        this.camera.reset = function() {
            this.aimTarget = null
            let ret = this.resetOld(...arguments)
            return ret
        }
    }

    updateAimbot() {
        if (!this.settings.autoAim > 0) {
            return
        }
        if (!this.initialized) this.initAimbot()
        const target = this.getTarget()
        if (target) {
            if ((this.settings.autoAim === 3 && this.me.aimVal === 1) || (this.settings.autoAim === 4 && this.me.aimVal === 0)) return void this.camera.camLookAt(null)
            target.y += this.hooks.config.playerHeight - this.hooks.config.cameraHeight - this.hooks.config.crouchDst * target.crouchVal
            target.y -= (this.me.recoilAnimY * this.hooks.config.recoilMlt) * 25
            this.camera.camLookAt(target.x, target.y, target.z)
            if (this.settings.autoAim === 1) {
                if (this.camera.mouseDownR !== 1) {
                    this.camera.mouseDownR = 1
                } else {
                    this.camera.mouseDownL = this.camera.mouseDownL === 1 ? 0 : 1
                }
            } else if (this.settings.autoAim === 2) {
                this.camera.mouseDownR = 1
                if (this.me.aimVal === 0) {
                    if (this.camera.mouseDownL === 0) {
                        this.camera.mouseDownL = 1
                    } else {
                        this.camera.mouseDownR = 0
                        this.camera.mouseDownL = 0
                    }
                }
            }
        } else {
            this.camera.camLookAt(null)
            if (this.settings.autoAim === 1) {
                this.camera.mouseDownL = 0
                if (this.camera.mouseDownR !== 0) {
                    this.camera.mouseDownR = 0
                }
            } else if (this.settings.autoAim === 2) {
                this.camera.mouseDownR = 0
                this.camera.mouseDownL = 0
            }
        }
    }

    changeSettings() {
        if (this.settings.aimSettings) {
            this.hooks.config.camChaseTrn = 0.05
            this.hooks.config.camChaseSpd = 15000000
            this.hooks.config.camChaseSen = 15000000
            this.hooks.config.camChaseDst = 0
        } else {
            this.hooks.config.camChaseTrn = .0022
            this.hooks.config.camChaseSpd = .0012
            this.hooks.config.camChaseSen = .2
            this.hooks.config.camChaseDst = 24
        }
    }

    render() {
        this.ctx.clearRect(0, 0, innerWidth, innerHeight)
        this.drawESP()
        this.drawFPS()
        this.drawFlag()
        this.autoRespawn()
        requestAnimationFrame(this.render.bind(this))
    }

    loop(camera, me, inputs, game, socket = null, u = null) {
        this.me = me
        this.camera = camera
        this.game = game
        this.inputs = inputs
        this.bhop()
        this.updateAimbot()
        this.noRecoil()
        this.autoSwap()
    }

    setSetting(t, e) {
        document.getElementById(`slid_hack${t}`) && (document.getElementById(`slid_hack${t}`).innerHTML = e),
            this.settingsMenu[t].set(e),
            this.settingsMenu[t].val = e,
            this.saveVal(`kro_set_hack_${t}`, e)
    }

    saveVal(t, e) {
        const r = "undefined" != typeof Storage;
        r && localStorage.setItem(t, e)
    }

    getSavedVal(t) {
        const r = "undefined" != typeof Storage;
        return r ? localStorage.getItem(t) : null
    }

    onLoad() {
        window.playerInfos.style.width = "0%"
        this.createCanvas()
        this.createFPSCounter()
        this.createMenu()
    }
}

GM_xmlhttpRequest({
    method: "GET",
    url: "https://krunker.io/js/game.js",
    onload: res => {
        let code = res.responseText
        code = code.replace(/String\.prototype\.escape=function\(\){(.*)\)},(Number\.)/, "$2")
            .replace(/if\(\w+\.notObst\){/, "if(true){")
            .replace(/}else \w+\.style\.display="none"/, "}")
            .replace(/(\bthis\.list\b)/g, "window.hack.hooks.entities")
            .replace(/\w+\.players\.list/g, "window.hack.hooks.entities")
            .replace(/(function\(\w+,(\w+),\w+,\w+,\w+,\w+,\w+\){var \w+,\w+,\w+,\w+;window\.hack\.hooks\.entities=\[\])/, "$1;window.hack.hooks.world=$2")
            .replace(/(\w+\.style\.left=)100\*(\w+\.\w+)\+"%",/, '$1$2*innerWidth+"px",window.hack.hooks.entities[i].hookedX=$2*innerWidth,')
            .replace(/(\w+\.style\.top=)100\*\(1-(\w+\.\w+)\)\+"%",/, '$1(1-$2)*innerHeight+"px",window.hack.hooks.entities[i].hookedY=(1-$2)*innerHeight,')
            .replace(/"mousemove",function\((\w+)\){if\((\w+)\.enabled/, '"mousemove",function($1){window.hack.hooks.context = $2;if($2.enabled')
            .replace(/(\w+).processInput\((\w+),(\w+)\),(\w+).moveCam/, 'window.hack.loop($4, $1, $2, $3), $1.processInput($2,$3),$4.moveCam')
            .replace(/(\w+).exports\.ambientVal/, 'window.hack.hooks.config = $1.exports, $1.exports.ambientVal')
            .replace(/window\.updateWindow=function/, 'windows.push({header: "Hack Settings", html: "",gen: function () {var t = ""; for (var key in window.hack.settingsMenu) {window.hack.settingsMenu[key].pre && (t += window.hack.settingsMenu[key].pre), t += "<div class=\'settName\'>" + window.hack.settingsMenu[key].name + " " + window.hack.settingsMenu[key].html() + "</div>";} return t;}});window.hack.setupSettings();\nwindow.updateWindow=function')
            .replace(/window\.addEventListener\("keydown",function\((\w+)\){/, 'window.addEventListener("keydown",function($1){window.hack.keyDown($1),')
            .replace(/window\.addEventListener\("keyup",function\((\w+)\){/, 'window.addEventListener("keyup",function($1){window.hack.keyUp($1),')
            .replace(/hitHolder\.innerHTML=(\w+)}\((\w+)\),(\w+).update\((\w+)\)(.*)"block"==nukeFlash\.style\.display/, 'hitHolder.innerHTML=$1}($2),$3.update($4),"block" == nukeFlash.style.display');


        GM_xmlhttpRequest({
            method: "GET",
            url: "https://krunker.io/",
            onload: res => {
                let html = res.responseText
                html = html.replace(' src="js/game.js">', `>${Hack.toString()}\nwindow.hack = new Hack();\n${code.toString()}`)
                document.open()
                document.write(html)
                document.close()
            }
        })
    }
})
