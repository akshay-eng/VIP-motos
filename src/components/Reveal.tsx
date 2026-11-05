import { motion, type HTMLMotionProps } from "motion/react";
import { fadeUp, stagger } from "@/lib/motion";

/** Fades and lifts content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={{ hidden: fadeUp.hidden, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggers direct <RevealItem> children. Keep lists short: the total stays under 400ms. */
export function RevealGroup({ children, step = 0.06, ...rest }: HTMLMotionProps<"div"> & { step?: number }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }} variants={stagger(step)} {...rest}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}
