// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { narrowModeThresholds } from 'DetailsView/components/narrow-mode-detector';
import { Browser } from '../../common/browser';
import { launchBrowser } from '../../common/browser-factory';
import { navMenuSelectors } from '../../common/element-identifiers/details-view-selectors';
import { DetailsViewPage } from '../../common/page-controllers/details-view-page';
import { scanForAccessibilityIssues } from '../../common/scan-for-accessibility-issues';

describe('Details View -> Assessment -> Reflow', () => {
    let browser: Browser;
    let detailsViewPage: DetailsViewPage;
    const height = 400;

    beforeAll(async () => {
        browser = await launchBrowser({
            suppressFirstTimeDialog: true,
            addExtraPermissionsToManifest: 'fake-activeTab',
        });

        detailsViewPage = (await browser.newAssessment()).detailsViewPage;
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
            browser = undefined;
        }
    });

    const { commandBarMenuButtonSelectors, hamburgerMenuButtonSelectors } = navMenuSelectors;

    const commandBarWindowWidth = narrowModeThresholds.collapseCommandBarThreshold - 1;
    const hamburgerButtonWindowWidth = narrowModeThresholds.collapseHeaderAndNavThreshold - 1;

    describe.each`
        componentName           | componentSelectors               | width
        ${'command bar button'} | ${commandBarMenuButtonSelectors} | ${commandBarWindowWidth}
        ${'hamburger button'}   | ${hamburgerMenuButtonSelectors}  | ${hamburgerButtonWindowWidth}
    `('With $componentName visible', ({ componentName, componentSelectors, width }) => {
        beforeAll(async () => {
            await detailsViewPage.setViewport(width, height);
            await detailsViewPage.waitForSelector(componentSelectors.collapsed);
        });

        it.each([true, false])(
            `should pass accessibility validation with high contrast mode=%s`,
            async highContrastMode => {
                await scanForA11yIssuesWithHighContrast(
                    highContrastMode,
                    componentName === 'hamburger button' ? 0 : 1,
                );
            },
        );

        describe(`with ${componentName} expanded`, () => {
            beforeAll(async () => {
                await setButtonExpandedState(componentSelectors, true);
            });

            afterAll(async () => {
                await setButtonExpandedState(componentSelectors, false);
            });

            it.each([true, false])(
                `should pass accessibility validation with command bar menu open and high contrast mode=%s`,
                async highContrastMode => {
                    await scanForA11yIssuesWithHighContrast(highContrastMode, 1);
                },
            );
        });
    });

    async function scanForA11yIssuesWithHighContrast(
        highContrastMode: boolean,
        expectedFailures: number,
    ): Promise<void> {
        await browser.setHighContrastMode(highContrastMode);
        await detailsViewPage.waitForHighContrastMode(highContrastMode);

        const results = await scanForAccessibilityIssues(detailsViewPage, '*');
        // Note: long-term, expectedFailures should always be 0 and it should not
        // be passed in as a parameter. It's here as a temporary workaround for
        // issue https://github.com/dequelabs/axe-core/issues/2459
        expect(results).toHaveLength(expectedFailures);
    }

    async function setButtonExpandedState(
        buttonSelectors: { expanded: string; collapsed: string },
        expanded: boolean,
    ): Promise<void> {
        const oldSelector = expanded ? buttonSelectors.collapsed : buttonSelectors.expanded;
        const newSelector = expanded ? buttonSelectors.expanded : buttonSelectors.collapsed;
        await detailsViewPage.clickSelector(oldSelector);
        await detailsViewPage.waitForSelector(newSelector);
    }
});