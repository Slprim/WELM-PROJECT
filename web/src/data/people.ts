import drFaithJoseph from "../assets/people/dr-faith-joseph.jpg";
import pastorDeborahFaith from "../assets/people/pastor-deborah-faith.jpg";
import jessicaAnkrah from "../assets/people/jessica-ankrah.jpg";
import pastorSamuelSosi from "../assets/people/pastor-samuel-sosi.jpg";
import pastorPrinceObodai from "../assets/people/pastor-prince-obodai.jpg";
import pastorSolomonAsamoah from "../assets/people/pastor-solomon-asamoah.jpg";
import pastorJanetOdoom from "../assets/people/pastor-janet-odoom.jpg";
import mrsVictoriaBroni from "../assets/people/mrs-victoria-broni.jpg";

/**
 * Committee portraits, carried over from the legacy site's `img/PTS/` folder.
 *
 * Keyed by the member's name so the photo survives reordering, and so a
 * portrait uploaded into Sanity can override it without touching this file.
 * Anyone without a match still falls back to their initials.
 */
export const portraits: Record<string, ImageMetadata> = {
  "Dr. Faith Joseph": drFaithJoseph,
  "Pastor Deborah Faith": pastorDeborahFaith,
  "Jessica Ankrah": jessicaAnkrah,
  "Pastor Samuel Sosi": pastorSamuelSosi,
  "Pastor Prince Obodai": pastorPrinceObodai,
  "Pastor Solomon Asamoah": pastorSolomonAsamoah,
  "Pastor Janet Odoom": pastorJanetOdoom,
  "Mrs Victoria Broni": mrsVictoriaBroni,
};
