const TM1637 = require('./tm1637.js').tm1637;

const myDisplay = new TM1637(22, 23, 5); // clk, dio, brightness

// without leading zeros
console.log('without leading zeros');
myDisplay.setZero(0);

for (i=-50; i<51; i++) {
    myDisplay.displayDec(i);
    TM1637.delay_ms(200);
}

// with leading zeros
console.log('with leading zeros');
myDisplay.setZero(1);

for (i=-50; i<51; i++) {
    myDisplay.displayDec(i);
    TM1637.delay_ms(200);
}
myDisplay.setZero(0);

// try dots
console.log("Dots");
for (i=0; i<20; i++) {
    myDisplay.setDots(i%2);
    myDisplay.displayDec(1234);
    TM1637.delay_ms(500);
}

// try brightness
console.log("Brightness");
for (i=0; i<8; i++) {
    myDisplay.setBrightness(i);
    myDisplay.displayDec(i);
    TM1637.delay_ms(1000);
}
for (i=6; i>=0; i--) {
    myDisplay.setBrightness(i);
    myDisplay.displayDec(i);
    TM1637.delay_ms(1000);
}

// speed test
myDisplay.setBrightness(4);
console.log('speed test');
let t0 = performance.now();
for (i=0; i<10000; i++) {
   myDisplay.displayDec(i);
}
let t1 = performance.now();
console.log("Elapsed time:",t1-t0,"ms for 10'000 loops");