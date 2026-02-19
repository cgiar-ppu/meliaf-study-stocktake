import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Introduction() {
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">MELIAF Studies Explorer – Prototype</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-base leading-relaxed">
          <p>
            This is a prototype solution to collect, explore, and derive value from CGIAR's planned
            and ongoing MELIAF (Monitoring, Evaluation, Learning, Impact Assessment and Foresight)
            studies. The approach will be refined over time based on user feedback.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Value proposition</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <span className="font-semibold">For CGIAR scientists and support staff</span> — We
                aim to make the full range of planned and ongoing MELIAF studies visible so that
                teams can learn from each other, improve study design and delivery, identify gaps and
                synergies, and strengthen collaboration across CGIAR.
              </li>
              <li>
                <span className="font-semibold">For funders</span> — Funders are interested in the
                breadth and coherence of CGIAR's MELIAF work. Once sufficient content is available, a
                public-facing dashboard will be shared.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Who is included</h2>
            <p>
              The goal is to capture planned and ongoing MELIAF studies from across CGIAR, including:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Centers</li>
              <li>Projects</li>
              <li>Programs and Accelerators</li>
              <li>Independent Advisory and Evaluation Service (IAES)</li>
              <li>System entities</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What counts as a MELIAF study</h2>
            <blockquote className="border-l-4 border-primary bg-muted/50 py-3 pl-4 pr-3 italic">
              Information generated through a structured analytical process, with an explicit
              question, method, and documented assumptions, intended to support accountability,
              learning and decision-making about future research, and to provide evidence for
              communications and resource mobilization.
            </blockquote>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Where the data is stored</h2>
            <p>
              Data will be stored in CG360, and the web application code is available on GitHub.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Who manages this work</h2>
            <p>
              The MELIAF study stocktake is a joint initiative of CGIAR's MEL, Impact Assessment,
              and Foresight Communities of Practice under the Strengthening Institutional Integration
              (MELIAF) grant. The Portfolio Performance and Results Team (PPT) coordinates the
              effort.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Learn more</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                MELIAF project:{" "}
                <a
                  href="https://sites.google.com/cgxchange.org/cgiarprhub/meliaf-project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  https://sites.google.com/cgxchange.org/cgiarprhub/meliaf-project
                </a>
              </li>
              <li>
                Contact:{" "}
                <a
                  href="mailto:performanceandresults@cgiar.org"
                  className="text-primary underline hover:text-primary/80"
                >
                  performanceandresults@cgiar.org
                </a>
              </li>
              <li>
                GitHub:{" "}
                <a
                  href="https://github.com/cgiar-ppu/meliaf-study-stocktake"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  cgiar-ppu/meliaf-study-stocktake
                </a>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
