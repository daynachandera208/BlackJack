import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayCard} from "./PlayCard"
export class PlayerHandData extends Schema{
  @type('uint8') points:number;
  @type('uint64') bet:number;
  @type([PlayCard]) cards:ArraySchema<PlayCard>;
  @type('boolean') isDouble:boolean;
  @type('boolean') isInsured:boolean;
  @type('boolean') isSurrender:boolean;
  @type('boolean') isSplited:boolean;
  @type('uint8') splitno:number;

  
} 