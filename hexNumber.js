const TM1637 = require('./tm1637.js').tm1637;

const myDisplay = new TM1637(22, 23, 5); // clk, dio, brightness

// without leading zeros
console.log('Hex value');

for (i=-50; i<51; i++) {
    myDisplay.displayHex(i);
    console.log(i);
    TM1637.delay_ms(200);
}