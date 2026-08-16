import siteSettings from "./siteSettings";
import service from "./service";
import sermon from "./sermon";
import post from "./post";
import person from "./person";
import yearlyTheme from "./yearlyTheme";
import testimony from "./testimony";
import historyEvent from "./historyEvent";
import faithArticle from "./faithArticle";
import faq from "./faq";

export const schemaTypes = [
  // Singletons
  siteSettings,
  // Collections
  service,
  sermon,
  post,
  person,
  yearlyTheme,
  testimony,
  historyEvent,
  faithArticle,
  faq,
];
