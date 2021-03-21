import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayCard} from "./PlayCard"
export class DelarData extends Schema{
    @type('uint8') points:number;
    @type([PlayCard]) cards:ArraySchema<PlayCard>;
}
