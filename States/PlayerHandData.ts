import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayCard} from "./PlayCard"
//used for strring current state of Player Hand for both single and splited cards
export class PlayerHandData extends Schema{
  @type('uint8') 
  points:number;//crad points total
  
  @type('uint64') 
  bet:number;//bet ammount for current hand
  
  @type([PlayCard]) 
  cards:ArraySchema<PlayCard>;//arrayschema storing cards for player
  
  @type('boolean') 
  isDouble:boolean;//determines doubled up Bet
  
  @type('boolean') 
  isInsured:boolean;//determines insured Bet
  
  @type('boolean') 
  isSurrender:boolean;//determines surrendered Bet
  
  @type('boolean') 
  isSplited:boolean;//determines Splited Bet
  
  @type('uint8') 
  splitno:number;// current split no (used when cards are splitted)

  
} 