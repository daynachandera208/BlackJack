import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
export enum CardsType{
    Spades = 1,
    Clubs=2,
    Hearts=3,
    Diamonds=4
  }
  export class PlayCard extends Schema{
    @type('int32') cardType:CardsType; 
   @type('int32') cardValue;
   @type('int32') cardPoint;
  }