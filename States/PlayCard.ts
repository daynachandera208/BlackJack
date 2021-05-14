import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
// enum to handle card sutes
export enum CardsType
{
    Spades = 1,
    Clubs=2,
    Hearts=3,
    Diamonds=4
}
//used to store crads daa for single card 
export class PlayCard extends Schema
{
     @type('int32') 
     cardType:CardsType; //sute of cards
     
     @type('int32') 
     cardValue:number; //number of cards 1 to 13 13=King ... 11=Jack
     
     @type('int32') 
     cardPoint:number;//used to store point of cards acording to blackjack
}