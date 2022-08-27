Gpio = require('pigpio').Gpio;

class tm1637 {
    // private 

    /**
     * Specific commands
     */
    #TM1637_ADDR_AUTO = 0x40; 
    #TM1637_START_ADDR = 0xC0; 
    #TM1637_DISPLAY_ON = 0x88; 

    #pinClk
    #pinDio
    #brightness
    #data
    #dot
    #text
    #zero

    // 
    //      A
    //     ---
    //  F |   | B
    //     -G-
    //  E |   | C
    //     ---
    //      D
    #digitToSegment = [
        //XGFEDCBA
        0b00111111,    // 0
        0b00000110,    // 1
        0b01011011,    // 2
        0b01001111,    // 3
        0b01100110,    // 4
        0b01101101,    // 5
        0b01111101,    // 6
        0b00000111,    // 7
        0b01111111,    // 8
        0b01101111,    // 9
        0b01110111,    // A
        0b01111100,    // b
        0b00111001,    // C
        0b01011110,    // d
        0b01111001,    // E
        0b01110001,    // F
        0b00111101,    // G
        0b01110110,    // H
        0b00000110,    // I
        0b00011110,    // J
        0b00000000,    // K none
        0b00111000,    // L
        0b00110111,    // M
        0b00110111,    // N
        0b00111111,    // O
        0b01110011,    // P
        0b01100111,    // q
        0b01010000,    // r
        0b01101101,    // S
        0b01111000,    // t
        0b00111110,    // U
        0b00111110,    // V
        0b00000000,    // W none
        0b00000000,    // X none
        0b01101110,    // Y
        0b00000000,    // Z none
        0b00111001,    // [
        0b01100011,    // / for degree °  
        0b00001111,    // ]
        0b01000000     // ^ for minus -
    ];

    /**
     * Defaut settings: no dot, no leading zeros
     * @param {*} clk 
     * @param {*} dio 
     * @param {*} brightness 
     */
    constructor(clk, dio, brightness = 7) {
        this.#brightness = brightness;
        this.#data = [0, 0, 0, 0];
        this.#dot = 0;
        this.#text = "";
        this.#zero = 0;

        // setting #pins
        this.#pinClk = new Gpio(clk, {
            mode: Gpio.INPUT,
            pullUpDown: Gpio.PUD_UP
        });
        this.#pinDio = new Gpio(dio, {
            mode: Gpio.INPUT,
            pullUpDown: Gpio.PUD_UP
        });
        this.#pinDio.mode(Gpio.INPUT);
    }

    /**
     * Wait for x (float) ms  
     */
    #delay(ms) {
        var t0 = performance.now();
        do {
            var t1 = performance.now();
        }
        while (t1 - t0 < ms);
    }

    #start() {
        this.#pinDio.mode(Gpio.OUTPUT);
        this.#pinDio.digitalWrite(0);
        this.#delay(0.01);
    }

    #stop() {
        this.#pinDio.mode(Gpio.OUTPUT);
        this.#pinDio.digitalWrite(0);
        this.#delay(0.01);
        this.#pinClk.mode(Gpio.OUTPUT);
        this.#pinClk.digitalWrite(1);
        this.#delay(0.01);
        this.#pinDio.digitalWrite(1);
        this.#delay(0.01);
    }

    #writeByte(value) {
        for (let i = 0; i < 8; i++) {
            this.#pinClk.mode(Gpio.OUTPUT);
            this.#pinClk.digitalWrite(0);
            this.#delay(0.01);
            if (value % 2 == 1) {
                this.#pinDio.mode(Gpio.OUTPUT);
                this.#pinDio.digitalWrite(1);
            }
            else {
                this.#pinDio.mode(Gpio.OUTPUT);
                this.#pinDio.digitalWrite(0);
            }
            this.#delay(0.01);
            value = Math.floor(value / 2);
            this.#pinClk.digitalWrite(1);
            this.#delay(0.01);
        }
        // ack
        this.#pinClk.digitalWrite(0);
        this.#pinClk.mode(Gpio.INPUT); //clk high
        this.#pinDio.mode(Gpio.INPUT);
        this.#delay(0.01);

        if (this.#pinDio.digitalRead() == 0) {
            this.#pinDio.mode(Gpio.OUTPUT);
            this.#pinDio.digitalWrite(0);
        }
        this.#delay(0.01);
        this.#pinClk.mode(Gpio.OUTPUT);
        this.#pinClk.digitalWrite(0);
        this.#delay(0.01);
    }

    #writeSegments(segments) {
        // Write ADDR_AUTO
        this.#start();
        this.#writeByte(this.#TM1637_ADDR_AUTO);
        this.#stop();

        // Write START_ADDR + first digit address
        this.#start();
        this.#writeByte(this.#TM1637_START_ADDR);

        // Write the data bytes
        for (let k = 0; k < segments.length; k++)
            this.#writeByte(segments[k]);
        this.#stop();

        // Write DISPLAY_ON + brightness
        this.#start();
        this.#writeByte(this.#TM1637_DISPLAY_ON + (this.#brightness & 0x0f));
        this.#stop();
    }

    // public 

    /**
     * Wait for x (int) ms
     */
    static delay_ms(ms) {
        var date = new Date();
        var curDate = null;
        do {
            curDate = new Date();
        }
        while (curDate - date < ms);
    }

    /**
     * Brightness uses 3 bits.
     */
    setBrightness(brightness) {
        this.#brightness = brightness % 8;
    }

    /**
     * Turn off the display
     */
    clear() {
        this.#data = [0, 0, 0, 0];
        this.#writeSegments(this.#data);
    }

    /**
     * management of leading zeros
     * zero at 1 : 0001, zero at 0 : ___1 
     */
    setZero(value) {
        this.#zero = value % 2;
    }

    /**
     * Display decimal value (-999 -> 9999)
     * @param {*} value
     */
     displayDec(value) { 
        if (value >= 0) {
            let val = value;
            for (let i = 0; i < 4; i++) {
                this.#data[3 - i] = this.#digitToSegment[value % 10] + 0x80 * this.#dot;
                value = Math.floor(value / 10);
            }
            if (this.#zero == 0) {
                if (val < 1000) this.#data[0] = 0;
                if (val < 100) this.#data[1] = 0;
                if (val < 10) this.#data[2] = 0;
            }

        }
        else {
            value *= -1; // to set it >= 0
            let val = value;
            for (let i = 0; i < 4; i++) {
                this.#data[3 - i] = this.#digitToSegment[value % 10] + 0x80 * this.#dot;
                if ( i==3)
                    this.#data[3 - i] = this.#digitToSegment[this.#digitToSegment.length - 1] + 0x80 * this.#dot;
                value = Math.floor(value / 10);
            }
            if (this.#zero == 0) {
                if (val < 100) this.#data[1] = 0;
                if (val < 10) this.#data[2] = 0;
            }
        }
        this.#writeSegments(this.#data);
    }

    /**
     * Display value (-32768d -> 65535d) in hexadecimal (0x8000 => 0xFFFF)
     * @param {*} value
     */
    displayHex(value) {
        if (value > 0){
            value %= 65536;
        }
        else {
            value += 65536;
        }
        let val = value;
        for (let i = 0; i < 4; i++) {
            this.#data[3 - i] = this.#digitToSegment[value % 16] + 0x80 * this.#dot;
            value = Math.floor(value / 16);
        }
        if (this.#zero == 0) {
            if (val < 16**3) this.#data[0] = 0;
            if (val < 16**2) this.#data[1] = 0;
            if (val < 16) this.#data[2] = 0;
        }
        this.#writeSegments(this.#data);
    }

    /**
     * Displays encoded segments in a 4-byte array bXGFEDCBA
     * @param {*} segments 
     */
    displaySegments(segments) {
        for (let i = 0; i < 4; i++) {
            this.#data[i] = segments[i];
        }
        this.#writeSegments(this.#data);
    }

    /**
     * dot value is 0 to turn off the dots, or 1 to turn them on.
     */
    setDots(dot) {
        this.#dot = dot % 2;
    }

    /**
     * 
     * @param {*} text 
     */
    setText(text) {
        this.#text = text.toUpperCase();
    }

    isTextEmpty() {
        return (this.#text.length == 0);
    }

    /*
    showText() {
        if (!this.isTextEmpty()) {
            for (let i = 0; i < 4; i++) {
                if (i < this.#text.length) {
                    let code = this.#text.charCodeAt(i) - 0x30;
                    // if not alphanumeric character
                    if (code < 0) this.#data[i] = 0;
                    else {
                        // numeric character
                        if (code < 10) this.#data[i] = this.#digitToSegment[code];
                        else {
                            code -= 7;
                            if (code < 10 || code > 34) this.#data[i] = 0;
                            else this.#data[i] = this.#digitToSegment[code];
                        }
                    }
                }
                else this.#data[i] = 0; // 
            }
            this.#writeSegments(this.#data);
        }
    }
    */

    showText() {
        if (!this.isTextEmpty()) {
          for (let i=0; i<4; i++) {
            if (i<this.#text.length) {
              let code = this.#text.charCodeAt(i) - 0x30; // numbers
              if (code > 9) code -= 7; // letters
              if (code < 0 || code > this.#digitToSegment.length - 1) this.#data[i] = 0;
              else this.#data[i] = this.#digitToSegment[code];
            }
            else this.#data[i] = 0; //
          }
          this.#writeSegments(this.#data);
        }
      }

    displayText(text) {
        if (text != "") this.#text = text.toUpperCase();
        this.showText();
    }

    scrollText() {
        if (!this.isTextEmpty()) {
            this.#text = this.#text.slice(1);
            this.showText();
        }
    }

}

module.exports = { tm1637 };