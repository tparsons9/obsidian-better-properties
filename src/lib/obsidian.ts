import { moment as obsidianMoment } from "obsidian";
import type { Moment, MomentInput } from "moment";

// Obsidian provides the callable Moment factory; its namespace declaration loses
// that call signature with TypeScript 6's module interoperability rules.
export const moment = obsidianMoment as unknown as (input?: MomentInput) => Moment;
