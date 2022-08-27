const TM1637 = require('./tm1637.js').tm1637;

const myDisplay = new TM1637(22, 23, 5); // clk, dio, brightness

    // bXGFEDCBA
    //      A
    //     ---
    //  F |   | B
    //     -G-
    //  E |   | C
    //     ---
    //      D

const snake = [
    [1, 1, 1, 0],
    [0, 1, 1, 1],
    [0, 0, 1, 3],
    [0, 0, 0, 7],
    [0, 0, 0, 14],
    [0, 0, 8, 12],
    [0, 8, 8, 8],
    [8, 8, 8, 0],
    [24, 8, 0, 0],
    [56, 0, 0, 0],
    [49, 0, 0, 0],
    [33, 1, 0, 0]
]


for (i=0; i<48; i++) {
    myDisplay.displaySegments(snake[i % 12]);
    TM1637.delay_ms(250);
}