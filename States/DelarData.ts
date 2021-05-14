import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayCard} from "./PlayCard"
// Schema that s used to store delars cards and points
export class DelarData extends Schema
{
    @type('uint8') 
    points:number;//current card points for delar

    @type([PlayCard])
    cards:ArraySchema<PlayCard>; // to store Cards distributed to delar
}
