import * as fs from "node:fs";
import * as TOML from "@iarna/toml";
import { rest } from "msw";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import {
	msw,
	mswSuccessOauthHandlers,
	mswSuccessUserHandlers,
	mswSuccessDeploymentDetails,
	mswSuccessDeploymentScriptMetadata,
	createFetchResult,
} from "./helpers/msw";
import { mswSuccessDeployments } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import writeWranglerToml from "./helpers/write-wrangler-toml";

describe("deployments", () => {
	const std = mockConsoleMethods();
	runInTempDir();
	mockAccountId();
	mockApiToken();
	runInTempDir();

	beforeEach(() => {
		msw.use(
			...mswSuccessDeployments,
			...mswSuccessOauthHandlers,
			...mswSuccessUserHandlers,
			...mswSuccessDeploymentScriptMetadata,
			...mswSuccessDeploymentDetails
		);
	});

	it("should log helper message for deployments command", async () => {
		await runWrangler("deployments --help");
		expect(std.out).toMatchInlineSnapshot(`
		"wrangler deployments [deployment-id]

		🚢 Displays the 10 most recent deployments for a worker

		Commands:
		  wrangler deployments rollback [deployment-id]  🔙 Rollback a deployment

		Positionals:
		  deployment-id  The ID of the deployment you want to inspect  [string]

		Flags:
		  -c, --config   Path to .toml configuration file  [string]
		  -e, --env      Environment to use for operations and .env files  [string]
		  -h, --help     Show help  [boolean]
		  -v, --version  Show version number  [boolean]

		Options:
		      --name  The name of your worker  [string]

		🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose"
	`);
	});

	it("should log deployments", async () => {
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-script-name",
			}),
			"utf-8"
		);

		await runWrangler("deployments");
		expect(std.out).toMatchInlineSnapshot(`
		"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose


		Deployment ID: Galaxy-Class
		Created on: 2021-01-01T00:00:00.000000Z
		Author: Jean-Luc-Picard@federation.org
		Source: 🤠 Wrangler

		Deployment ID: Intrepid-Class
		Created on: 2021-02-02T00:00:00.000000Z
		Author: Kathryn-Janeway@federation.org
		Source: 🤠 Wrangler
		🟩 Active"
	`);
	});

	it("should log deployments for script with passed in name option", async () => {
		await runWrangler("deployments --name something-else");
		expect(std.out).toMatchInlineSnapshot(`
		"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose


		Deployment ID: Galaxy-Class
		Created on: 2021-01-01T00:00:00.000000Z
		Author: Jean-Luc-Picard@federation.org
		Source: 🤠 Wrangler

		Deployment ID: Intrepid-Class
		Created on: 2021-02-02T00:00:00.000000Z
		Author: Kathryn-Janeway@federation.org
		Source: 🤠 Wrangler
		🟩 Active"
	`);
	});

	it("should error on missing script name", async () => {
		await expect(runWrangler("deployments")).rejects.toMatchInlineSnapshot(
			`[Error: Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name\`]`
		);
	});

	describe("deployment details", () => {
		it("should log deployment details", async () => {
			writeWranglerToml();
			fs.writeFileSync(
				"./wrangler.toml",
				TOML.stringify({
					compatibility_date: "2022-01-12",
					name: "test-script-name",
				}),
				"utf-8"
			);

			await runWrangler("deployments 1701-E");

			expect(std.out).toMatchInlineSnapshot(`
			"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose

			{
			  Tag: '',
			  Number: 0,
			  'Metadata.author_id': 'Picard-Gamma-6-0-7-3',
			  'Metadata.author_email': 'Jean-Luc-Picard@federation.org',
			  'Metadata.source': 'wrangler',
			  'Metadata.created_on': '2021-01-01T00:00:00.000000Z',
			  'Metadata.modified_on': '2021-01-01T00:00:00.000000Z',
			  'resources.script': {
			    etag: 'mock-e-tag',
			    handlers: [ 'fetch' ],
			    last_deployed_from: 'wrangler'
			  },
			  'resources.bindings': []
			}

						export default {
							async fetch(request) {
								return new Response('Hello World from Deployment 1701-E');
							},
						};"
		`);
		});
	});
	describe("rollback subcommand", () => {
		it("should successfully rollback and output a message", async () => {
			msw.use(
				// query param ?rollback_to=<deployment-id>
				rest.put(
					"*/account/:accountID/workers/scripts/:scriptName",
					(req, res, ctx) => {
						return res.once(
							ctx.json(
								createFetchResult(
									req.url.searchParams.get("rollback_to") === "Intrepid-Class"
										? {
												created_on: "2222-11-18T16:40:48.50545Z",
												modified_on: "2222-01-20T18:08:47.464024Z",
												id: "space_craft_1",
												tag: "alien_tech_001",
												tags: ["hyperdrive", "laser_cannons", "shields"],
												deployment_id: "galactic_mission_alpha",
												logpush: true,
												etag: "13a3240e8fb414561b0366813b0b8f42b3e6cfa0d9e70e99835dae83d0d8a794",
												handlers: [
													"interstellar_communication",
													"hyperspace_navigation",
												],
												last_deployed_from: "spaceport_alpha",
												usage_model: "intergalactic",
												script: `addEventListener('interstellar_communication', event =\u003e
							{ event.respondWith(transmit(event.request)) }
							)`,
												size: "1 light-year",
										  }
										: {}
								)
							)
						);
					}
				)
			);

			await runWrangler("deployments rollback Intrepid-Class");
			expect(std.out).toMatchInlineSnapshot(`
			"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose

			Successfully rolled back to deployment ID: Intrepid-Class
			Rollbacks metadata: undefined"
		`);
		});
	});
});
