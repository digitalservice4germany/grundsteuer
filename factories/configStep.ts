import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import type { ConfigStep } from "~/stepConfig";

export default Factory.define<ConfigStep>(() => ({
  name: faker.random.word(),
  headline: faker.random.words(),
  fields: [],
}));
