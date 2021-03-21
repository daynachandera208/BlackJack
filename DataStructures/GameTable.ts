import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
export class GameTable extends Schema
  {
    @type('uint64') minBet:Number;
    @type('uint64') maxBet:Number;
    @type('uint8') handsLimit:Number;
    @type('string') tableName:string;
    @type('uint32') entryFees:number;
  }