import crypto from "node:crypto";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { fetch } from "undici";
import { describe, expect, it } from "vitest";
import { RUN, runIn } from "./helpers/run";
import { dedent, makeRoot, seed } from "./helpers/setup";

function matchWorkersDev(stdout: string): string {
	return stdout.match(
		/https:\/\/smoke-test-worker-.+?\.(.+?\.workers\.dev)/
	)?.[1] as string;
}

describe("publish", async () => {
	const root = await makeRoot();
	const workerName = `smoke-test-worker-${crypto
		.randomBytes(4)
		.toString("hex")}`;
	const workerPath = path.join(root, workerName);
	let workersDev: string | null = null;

	it("init worker", async () => {
		const { stdout } = await runIn(root, [[workerName, "smoke-test-worker"]])`
    $ ${RUN} init ${workerName}
    `;
		expect(stdout).toMatchInlineSnapshot(`
			"Using npm as package manager.
			✨ Created smoke-test-worker/wrangler.toml
			? Would you like to use git to manage this Worker?
			🤖 Using default value in non-interactive context: yes
			✨ Initialized git repository at smoke-test-worker
			? No package.json found. Would you like to create one?
			🤖 Using default value in non-interactive context: yes
			✨ Created smoke-test-worker/package.json
			? Would you like to use TypeScript?
			🤖 Using default value in non-interactive context: yes
			✨ Created smoke-test-worker/tsconfig.json
			? Would you like to create a Worker at smoke-test-worker/src/index.ts?
			🤖 Using default value in non-interactive context: Fetch handler
			✨ Created smoke-test-worker/src/index.ts
			? Would you like us to write your first test with Vitest?
			🤖 Using default value in non-interactive context: yes
			✨ Created smoke-test-worker/src/index.test.ts

			added (N) packages, and audited (N) packages in (TIMINGS)

			(N) packages are looking for funding
			  run \`npm fund\` for details

			found 0 vulnerabilities
			✨ Installed @cloudflare/workers-types, typescript, and vitest into devDependencies

			To start developing your Worker, run \`cd smoke-test-worker && npm start\`
			To start testing your Worker, run \`npm test\`
			To publish your Worker to the Internet, run \`npm run deploy\`"
		`);
	});
	it("publish worker", async () => {
		const {
			stdout,
			stderr,
			raw: { stdout: rawStdout },
		} = await runIn(workerPath, [[workerName, "smoke-test-worker"]])`
	  $ ${RUN} publish
	`;
		expect(stdout).toMatchInlineSnapshot(`
			"Total Upload: xx KiB / gzip: xx KiB
			Uploaded smoke-test-worker (TIMINGS)
			Published smoke-test-worker (TIMINGS)
			  https://smoke-test-worker.SUBDOMAIN.workers.dev
			Current Deployment ID: 00000000-0000-0000-0000-000000000000"
		`);
		expect(stderr).toMatchInlineSnapshot('""');
		workersDev = matchWorkersDev(rawStdout);

		await setTimeout(2_000);
		await expect(
			fetch(`https://${workerName}.${workersDev}`).then((r) => r.text())
		).resolves.toMatchInlineSnapshot('"Hello World!"');
	});
	it("modify & publish worker", async () => {
		await seed(workerPath, {
			"src/index.ts": dedent`
        export default {
          fetch(request) {
            return new Response("Updated Worker!")
          }
        }`,
		});
		const {
			stdout,
			stderr,
			raw: { stdout: rawStdout },
		} = await runIn(workerPath, [[workerName, "smoke-test-worker"]])`
	  $ ${RUN} publish
	`;
		expect(stdout).toMatchInlineSnapshot(`
			"Total Upload: xx KiB / gzip: xx KiB
			Uploaded smoke-test-worker (TIMINGS)
			Published smoke-test-worker (TIMINGS)
			  https://smoke-test-worker.SUBDOMAIN.workers.dev
			Current Deployment ID: 00000000-0000-0000-0000-000000000000"
		`);
		expect(stderr).toMatchInlineSnapshot('""');
		workersDev = matchWorkersDev(rawStdout);

		await setTimeout(10_000);
		await expect(
			fetch(`https://${workerName}.${workersDev}`).then((r) => r.text())
		).resolves.toMatchInlineSnapshot('"Updated Worker!"');
	});

	it("delete worker", async () => {
		const { stdout, stderr } = await runIn(workerPath, [
			[workerName, "smoke-test-worker"],
		])`
	  $ ${RUN} delete
	  `;
		expect(stdout).toMatchInlineSnapshot(`
			"? Are you sure you want to delete smoke-test-worker? This action cannot be undone.
			🤖 Using default value in non-interactive context: yes
			Successfully deleted smoke-test-worker"
		`);
		expect(stderr).toMatchInlineSnapshot('""');
		await setTimeout(10_000);
		// This will break if the error page gets updated, but that seems like a rare occurence
		await expect(
			fetch(`https://${workerName}.${workersDev}`).then((r) => r.text())
		).resolves.toMatchInlineSnapshot(`
			"<!DOCTYPE html>
			<!--[if lt IE 7]> <html class=\\"no-js ie6 oldie\\" lang=\\"en-US\\"> <![endif]-->
			<!--[if IE 7]>    <html class=\\"no-js ie7 oldie\\" lang=\\"en-US\\"> <![endif]-->
			<!--[if IE 8]>    <html class=\\"no-js ie8 oldie\\" lang=\\"en-US\\"> <![endif]-->
			<!--[if gt IE 8]><!--> <html class=\\"no-js\\" lang=\\"en-US\\"> <!--<![endif]-->
			  <head>
			    <meta charSet=\\"utf-8\\"/>
			    <title>Page not found</title>
			    <link rel=\\"icon\\" type=\\"image/png\\" href=\\"https://workers.cloudflare.com/favicon.ico\\" sizes=\\"48x48\\"/>
			    <style>
			      body {
			        font-family: -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", \\"Roboto\\", \\"Oxygen\\", \\"Ubuntu\\", \\"Cantarell\\", \\"Fira Sans\\", \\"Droid Sans\\", \\"Helvetica Neue\\", sans-serif
			      }
			      #box {
			        margin-top: 160px;
			        margin-left: 10%;
			      }
			      h1 {
			        font-weight: normal;
			        font-size: 48px;
			        line-height: 150%;
			        color: #313131;
			      }
			      p {
			        position: absolute;
			        font-size: 24px;
			        line-height: 150%;
			        color: #4A4A4A;
			      }
			      svg {
			        position: relative;
			        top: 300px;
			        width: 200px;
			      }
			    </style>
			  </head>
			  <body>
			    <div id=\\"box\\">
			      <h1>There is nothing here yet</h1>
			      <p>If you expect something to be here, it may take some time.<br/>Please check back again later.</p>
			      <svg viewBox=\\"0 0 1430 375\\"><title>Cloudflare Workers logo (horizontal combination mark)</title><defs><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-a\\" x1=\\"50%\\" x2=\\"25.7%\\" y1=\\"100%\\" y2=\\"8.7%\\"><stop offset=\\"0%\\" stop-color=\\"#eb6f07\\"></stop><stop offset=\\"100%\\" stop-color=\\"#fab743\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-b\\" x1=\\"81%\\" x2=\\"40.5%\\" y1=\\"83.7%\\" y2=\\"29.5%\\"><stop offset=\\"0%\\" stop-color=\\"#d96504\\"></stop><stop offset=\\"100%\\" stop-color=\\"#d96504\\" stop-opacity=\\"0\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-c\\" x1=\\"42%\\" x2=\\"84%\\" y1=\\"8.7%\\" y2=\\"79.9%\\"><stop offset=\\"0%\\" stop-color=\\"#eb6f07\\"></stop><stop offset=\\"100%\\" stop-color=\\"#eb720a\\" stop-opacity=\\"0\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-d\\" x1=\\"50%\\" x2=\\"25.7%\\" y1=\\"100%\\" y2=\\"8.7%\\"><stop offset=\\"0%\\" stop-color=\\"#ee6f05\\"></stop><stop offset=\\"100%\\" stop-color=\\"#fab743\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-e\\" x1=\\"-33.2%\\" x2=\\"91.7%\\" y1=\\"100%\\" y2=\\"0%\\"><stop offset=\\"0%\\" stop-color=\\"#d96504\\" stop-opacity=\\".8\\"></stop><stop offset=\\"49.8%\\" stop-color=\\"#d96504\\" stop-opacity=\\".2\\"></stop><stop offset=\\"100%\\" stop-color=\\"#d96504\\" stop-opacity=\\"0\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-f\\" x1=\\"50%\\" x2=\\"25.7%\\" y1=\\"100%\\" y2=\\"8.7%\\"><stop offset=\\"0%\\" stop-color=\\"#ffa95f\\"></stop><stop offset=\\"100%\\" stop-color=\\"#ffebc8\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-g\\" x1=\\"8.1%\\" x2=\\"96.5%\\" y1=\\"1.1%\\" y2=\\"48.8%\\"><stop offset=\\"0%\\" stop-color=\\"#fff\\" stop-opacity=\\".5\\"></stop><stop offset=\\"100%\\" stop-color=\\"#fff\\" stop-opacity=\\".1\\"></stop></linearGradient><linearGradient id=\\"CloudflareWorkersLogoCombinationMarkHorizontal--gradient-h\\" x1=\\"-13.7%\\" y1=\\"104.2%\\" y2=\\"46.2%\\"><stop offset=\\"0%\\" stop-color=\\"#fff\\" stop-opacity=\\".5\\"></stop><stop offset=\\"100%\\" stop-color=\\"#fff\\" stop-opacity=\\".1\\"></stop></linearGradient></defs><path class=\\"CloudflareWorkersLogoCombinationMark--workers-wordmark\\" fill=\\"#232324\\" d=\\"M553.2 320.1L500.6 165h36.3l31.9 104.3 34.5-104.7h29L667 269.3 699 165h35.3l-52.5 155.1h-29.5l-34.8-100.8-34.7 100.8h-29.5zm246.2 1.5c-36.6 0-63.6-27-63.6-60.9v-.4c0-34 27.3-61.4 64-61.4 36.5 0 63.6 27 63.6 61v.4c0 33.8-27.3 61.3-64 61.3zm.4-28.8c19.1 0 30.6-14.7 30.6-32.1v-.4c0-17.4-12.6-32.6-31-32.6-19.2 0-30.6 14.7-30.6 32.1v.5c0 17.3 12.5 32.5 31 32.5zm87.8 26.2V201H921v23.8c6.8-16.2 17.8-26.8 37.6-26v35H957c-22.2 0-35.9 13.5-35.9 41.6V319h-33.4zm92 0V158.4h33.4V244l39.1-43h40l-44.8 46.5 46.4 71.5h-38.3l-30.8-48.2-11.6 12.3V319h-33.5zm180.6 2.6c-35.5 0-61.6-24.8-61.6-60.9v-.4c0-33.7 24-61.4 58.3-61.4 39.3 0 57.4 30.6 57.4 64 0 2.6-.2 5.7-.5 8.8h-82c3.3 15.2 13.8 23.1 28.8 23.1 11.2 0 19.4-3.5 28.6-12.1l19.1 17a59 59 0 0 1-48.1 22zm-28.9-70.8h50.4c-2-15-10.8-25-24.8-25-13.9 0-23 9.8-25.6 25zm107.8 68.2V201h33.5v23.8c6.8-16.2 17.8-26.8 37.6-26v35h-1.8c-22.2 0-35.8 13.5-35.8 41.6V319H1239zm133.4 2.2c-16.5 0-35-5.5-50.6-17.8l14.3-22a66.7 66.7 0 0 0 37.1 14c9.7 0 14.1-3.5 14.1-8.7v-.5c0-7.2-11.4-9.7-24.4-13.6-16.5-4.9-35.2-12.6-35.2-35.4v-.5c0-24 19.4-37.4 43.1-37.4 15 0 31.3 5 44 13.7l-12.7 23a69.9 69.9 0 0 0-32-11c-8 0-12.3 3.6-12.3 8.2v.4c0 6.6 11.3 9.7 24 14.1 16.5 5.5 35.7 13.4 35.7 35v.4c0 26.2-19.6 38.1-45.1 38.1z\\"></path><path class=\\"CloudflareWorkersLogoCombinationMark--cloudflare-wordmark\\" fill=\\"#656566\\" fill-rule=\\"nonzero\\" d=\\"M1210.9 78.9a6 6 0 1 1 0-12.1c3.3 0 6.1 2.7 6.1 6s-2.8 6-6.1 6zm0-11a4.9 4.9 0 0 0-4.9 5c0 2.6 2.2 4.8 4.9 4.8s4.9-2.2 4.9-4.9c0-2.6-2.2-4.8-4.9-4.8zm3.1 8.1h-1.4l-1.2-2.3h-1.6V76h-1.3v-6.6h3.2c1.4 0 2.3.9 2.3 2.1a2 2 0 0 1-1.4 2l1.4 2.5zm-2.4-3.5c.5 0 1-.3 1-1s-.4-1-1-1h-2v2h2zm-636.5-6.3h15.6v42.1H618v13.5H575V66.2zm58.9 28V94c0-16 13-29 30.3-29a29 29 0 0 1 30 28.8v.2c0 16-13 28.9-30.2 28.9A29 29 0 0 1 634 94.1zm44.6 0V94c0-8-5.8-15-14.4-15-8.5 0-14.2 6.8-14.2 14.9v.1c0 8 5.8 15 14.3 15 8.6 0 14.3-6.8 14.3-14.9zm34.9 3.2V66.2h15.8v31c0 8 4.1 11.7 10.3 11.7 6.2 0 10.3-3.6 10.3-11.4V66.2h15.8V97c0 18-10.3 25.8-26.3 25.8s-26-8-26-25.4zm76-31.2h21.6c20 0 31.7 11.4 31.7 27.5v.2c0 16-11.8 28-32 28h-21.3V66.1zm22 42c9.2 0 15.4-5.1 15.4-14.2V94c0-9-6.2-14.1-15.5-14.1h-6.3V108h6.3v.1zm54-42h44.9v13.5H881v9.5h26.6V102H881v19.8h-15.5V66.2zm66.5 0h15.5v42.1h27.2v13.5H932V66.2zm83.3-.4h15l24 56h-16.8l-4-9.9h-21.7l-4 10h-16.3l23.8-56.1zm13.7 34.1l-6.2-15.8-6.3 15.8h12.5zm45.2-33.7h26.6c8.6 0 14.5 2.2 18.3 6 3.3 3.2 5 7.5 5 13v.2c0 8.6-4.6 14.2-11.5 17L1126 122h-18l-11.4-16.8h-6.8v16.8h-15.6V66.2zm25.9 26.7c5.3 0 8.3-2.6 8.3-6.6v-.2c0-4.3-3.2-6.5-8.4-6.5h-10.3v13.3h10.4zm46.4-26.7h45v13H1162v8.5h26.9v12.2h-27v8.8h30.2v13.1h-45.5V66.2zM541 100.7a13.8 13.8 0 0 1-12.8 8.3c-8.5 0-14.3-7-14.3-15V94c0-8 5.7-15 14.2-15a14 14 0 0 1 13.3 9.3H558a29.2 29.2 0 0 0-29.6-23.1c-17.3 0-30.3 13-30.3 29v.1a29 29 0 0 0 30.1 28.8c14.8 0 26.4-9.5 29.4-22.2l-16.4-.1z\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-a)\\" d=\\"M107 5.4l49 88.4-45 81a26 26 0 0 0 0 25.3l45 81.2-49 88.4A52 52 0 0 1 85 349L7 213.5a52.2 52.2 0 0 1 0-52L85 26a52 52 0 0 1 22-20.6z\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-b)\\" d=\\"M111 174.9a26 26 0 0 0 0 25.2l45 81.2-49 88.4A52 52 0 0 1 85 349L7 213.5C.8 202.8 35.5 190 111 175z\\" opacity=\\".7\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-c)\\" d=\\"M112 14.3l44 79.5-7.3 12.7-38.8-65.7C98.7 22.5 81.6 32 60.2 69l3.2-5.5L85 26a52 52 0 0 1 21.8-20.6l5.1 8.9z\\" opacity=\\".5\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-d)\\" d=\\"M331 26l78 135.5c9.3 16 9.3 36 0 52L331 349a52 52 0 0 1-45 26h-78l97-174.9a26 26 0 0 0 0-25.2L208 0h78a52 52 0 0 1 45 26z\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-e)\\" d=\\"M282 374.4l-77 .7 93.2-175.8a27 27 0 0 0 0-25.4L205 0h17.6l97.8 173.1a27 27 0 0 1-.1 26.8 15624 15624 0 0 0-62.7 110c-19 33.4-10.8 54.9 24.4 64.5z\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-f)\\" d=\\"M130 375c-8 0-16-1.9-23-5.3l96.2-173.5c3-5.4 3-12 0-17.4L107 5.4A52 52 0 0 1 130 0h78l97 174.9a26 26 0 0 1 0 25.2L208 375h-78z\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-g)\\" d=\\"M298.2 178.8L199 0h9l97 174.9a26 26 0 0 1 0 25.2L208 375h-9l99.2-178.8c3-5.4 3-12 0-17.4z\\" opacity=\\".6\\"></path><path fill=\\"url(#CloudflareWorkersLogoCombinationMarkHorizontal--gradient-h)\\" d=\\"M203.2 178.8L107 5.4c3-1.6 6.6-2.8 10-3.8 21.2 38.1 52.5 95.9 94 173.3a26 26 0 0 1 0 25.2L115.5 373c-3.4-1-5.2-1.7-8.4-3.2l96-173.5c3-5.4 3-12 0-17.4z\\" opacity=\\".6\\"></path></svg>
			    </div>
			  </body>
			</html>
			"
		`);
	});
});
