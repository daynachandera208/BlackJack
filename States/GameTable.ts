import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
// Used to store dtata of Tables
export class GameTable extends Schema
{
    //minbet and maxbet are limits for chips to be played
    //handsLimit represent no. of hands per table for a game play
    //entry fees are fees deducted to enter in game play
    @type('uint64') 
    minBet:Number;
    
    @type('uint64') 
    maxBet:Number;
    
    @type('uint8') 
    handsLimit:Number;
    
    @type('string') 
    tableName:string;
    
    @type('uint32') 
    entryFees:number;
}