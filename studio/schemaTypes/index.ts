import siteSettings from "./siteSettings";
import page from "./page";
import service from "./service";
import sermon from "./sermon";
import post from "./post";
import person from "./person";
import yearlyTheme from "./yearlyTheme";
import testimony from "./testimony";
import historyEvent from "./historyEvent";
import faithArticle from "./faithArticle";
import faq from "./faq";
import galleryImage from "./galleryImage";
import monthlyTheme from "./monthlyTheme";
import programme from "./programme";

export const schemaTypes = [
  // Singletons
  siteSettings,
  page,
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
  galleryImage,
  monthlyTheme,
  programme,
];
