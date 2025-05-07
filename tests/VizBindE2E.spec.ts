import { test, expect } from '@grafana/plugin-e2e';

  async function setupNewDashboard(page) {
    await page.goto('http://localhost:3000/dashboards');
    await page.locator('#pageContent').getByRole('button', { name: 'New' }).click();
    const newDashboardButton = await page.getByRole('link', { name: 'New dashboard' });
    await newDashboardButton.click();
    const addVizualizactionButton = await page.getByTestId('data-testid Create new panel button');
    await addVizualizactionButton.click();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.locator('div').filter({ hasText: /^ScenarioRandom Walk$/ }).locator('svg').click();
    await page.getByText('CSV Content').click();
    await page.getByTestId('data-testid toggle-viz-picker').click();
    await page.getByText('VizBind').click();
  }
  
  test.describe('VizBind Tests', () => {
    // Basic Functionality Tests
    test('should verify initial diagram loads correctly', async ({ page }) => {
      await setupNewDashboard(page);

      const loadedDiagram = await page.getByText('Diagram LoadedMermaid diagram');
      expect(loadedDiagram).toBeTruthy();
    });

    test('should update panel title correctly', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByTestId('data-testid Panel editor option pane field input Title').fill('WOW')

      expect(await page.getByRole('heading', { name: 'WOW' }))
    });

    test('should handle invalid YAML configuration gracefully', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('textbox', { name: 'Enter YAML configuration...' }).fill('Making an error!!!!!!!!!!!!!')
      expect(await page.getByText('Diagram LoadedMermaid diagram'))
      expect(await page.locator('#flowchart-Router_1-189').getByText('CPU: $CPU, Memory: $Memory,'))
    });

    // UI Theme Tests
    test('should apply correct VizBind button theme', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.getByLabel('VizBind Button theme field').locator('svg').click();
      await page.getByRole('option', { name: 'VizBind' }).click();

      const button = await page.getByTestId('data-testid Options group YAML Configuration')
        .getByRole('button', { name: 'Select a File' });
      const backgroundImage = await button.evaluate(element => 
        window.getComputedStyle(element).backgroundImage);
      
      expect(backgroundImage).toBe('linear-gradient(45deg, rgb(255, 165, 0), rgb(255, 102, 0))');
    });

    // YAML Configuration Tests
    test('should navigate to YAML configuration editor', async ({ page }) => {
      await setupNewDashboard(page);

      await page.waitForTimeout(2000);

      await page.getByRole('button', { name: 'Edit YAML Config' }).click();
      
      expect(await page.getByRole('heading', { name: 'Edit YAML Configuration' }))
        .toBeTruthy();
    });

    test('should handle mermaid configuration errors', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('textbox', { name: 'Enter Mermaid configuration...' })
        .fill('Making an error !!!!!!!!!!!!');
      
      expect(await page.locator('div').filter({ hasText: /^Customize Mermaid Template$/ }).first())
        .toBeTruthy();
    });

    // Rule Management Tests
    test('should display binding rules tabs correctly', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      const bindTab1 = await page.getByTestId('data-testid Tab BindRule1');
      const bindTab2 = await page.getByTestId('data-testid Tab BindRule2');
      const bindTab6 = await page.getByTestId('data-testid Tab BindRule6');
      
      await expect(bindTab1).toContainText('BindRule1');
      await expect(bindTab2).toContainText('BindRule2');
      await expect(bindTab6).toContainText('BindRule6');
    });

    test('should create new rule with correct default name', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()
      const textContent = await page.getByRole('textbox', { name: 'Rule Name' }).textContent()
      expect(textContent === 'Rule_6')
    });

    test('should change rule type from binding to styling', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()
      
      await page.locator('div').filter({ hasText: /^Rule Type:Binding RuleRule Name:$/ }).locator('svg').click()
      expect(await page.getByRole('option', { name: 'Styling Rule' }).click())
      expect(await page.locator('div').filter({ hasText: /^Styling Rule$/ }).first())
    });

    // Function Management Tests
    test('should add If, Else If, Else blocks correctly', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()


      const functionButton = await page.getByRole('button', { name: 'Add Function' })
      await page.getByRole('button', { name: 'Add Function' }).click()
      expect(await functionButton.count()).toBe(0)
      expect(await page.getByTestId('data-testid Tab If'))

      const elseIfButton = await page.getByRole('button', { name: 'Add Else If' })
      await page.getByRole('button', { name: 'Add Else If' }).click()
      expect(await elseIfButton.count()).toBe(1)
      expect(await page.getByTestId('data-testid Tab Else If'))

      const elseButton = await page.getByRole('button', { name: 'Add Else' })
      await page.getByRole('button', { name: 'Add Else', exact: true }).click()
      expect(await elseButton.count()).toBe(1)
      expect(await page.getByTestId('data-testid Tab Else'))
    });

    test('should add multiple Else If conditions correctly', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()
      await page.getByRole('button', { name: 'Add Function' }).click()

      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Add Else If' }).click();
      }
      await page.getByTestId('data-testid Tab Else If').click()
      expect(await page.locator('div').filter({ hasText: /^Condition:$/ }).first())
      expect(await page.locator('div').filter({ hasText: /^Condition:$/ }).nth(1))
      expect(await page.locator('div').filter({ hasText: /^Condition:$/ }).nth(2))
      expect(await page.locator('div').filter({ hasText: /^Condition:$/ }).nth(3))

    });
    
    test('should undo rule creation actions correctly', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()

      const functionButton = await page.getByRole('button', { name: 'Add Function' })
      await page.getByRole('button', { name: 'Add Function' }).click()

      const elseIfButton = await page.getByRole('button', { name: 'Add Else If' })
      await page.getByRole('button', { name: 'Add Else If' }).click()

      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Undo' }).click()
      }
      expect(await elseIfButton.count()).toBe(0)
      expect(await functionButton.count()).toBe(1)
    });

    test('should reset rule creation to initial state', async ({ page, panelEditPage }) => {
      await setupNewDashboard(page);
      
      await page.getByRole('button', { name: 'Open Rule Configuration' }).click()
      await page.getByRole('button', { name: 'newRule' }).click()

      const functionButton = await page.getByRole('button', { name: 'Add Function' })
      await page.getByRole('button', { name: 'Add Function' }).click()

      const elseIfButton = await page.getByRole('button', { name: 'Add Else If' })
      await page.getByRole('button', { name: 'Add Else If' }).click()

      await page.getByRole('button', { name: 'Reset' }).click()

      expect(await elseIfButton.count()).toBe(0)
      expect(await functionButton.count()).toBe(1)
    });

    // Rule Inspection & Editing Tests
    test('should display binding rules on node click', async ({ page }) => {
      await setupNewDashboard(page);

      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      
      const bindTab1 = await page.getByTestId('data-testid Tab BindRule1');
      const bindTab2 = await page.getByTestId('data-testid Tab BindRule2');
      
      await expect(bindTab1).toContainText('BindRule1');
      await expect(bindTab2).toContainText('BindRule2');
    });
  
    test('should display styling rules on node click', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      
      const styleTab1 = await page.getByTestId('data-testid Tab StyleRule1');
      await expect(styleTab1).toContainText('StyleRule1');
    });
  
    test('should expand rule conditions when clicked', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      
      const ifCond = await page.getByRole('button', { name: 'If: CPU <' });
      const elseCond = await page.getByRole('button', { name: 'Else: No condition' });
      
      await expect(ifCond).toContainText('If:');
      await expect(elseCond).toContainText('Else:');
    });
  
    test('should enter rule edit mode correctly', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      
      const nameInput = await page.getByRole('textbox', { name: 'Rule Name' });
      const action = await page.getByText('applyClassalert');
      
      expect(nameInput).toBeTruthy();
      expect(action).toBeTruthy();
    });
  
    test('should add and remove elements from rules', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      
      await page.getByRole('button', { name: 'Add Elements' }).click();
      const elementInput = await page.getByText('Elements:Select Elements');
      expect(elementInput).toBeTruthy();
  
      await page.getByRole('button', { name: 'Undo' }).click();
      const elementsAddButton = await page.getByRole('button', { name: 'Add Elements' });
      elementInput.waitFor({state: 'detached'});
      expect(await elementInput.count()).toBe(0);
      expect(elementsAddButton).toBeTruthy();
    });
  
    test('should add and remove functions from existing rules', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      
      await page.getByRole('button', { name: 'trash-alt' }).nth(1).click();
      const functionAddButton = await page.getByRole('button', { name: 'Add Function' });
      const action = await page.getByText('applyClassalert');
      action.waitFor({ state: 'detached' });
      
      expect(functionAddButton).toBeTruthy();
      expect(await action.count()).toBe(0);
    });
  
    test('should show validation errors for incomplete rules', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      
      await page.getByRole('button', { name: 'trash-alt' }).nth(1).click();
      await page.getByRole('button', { name: 'Update' }).click();
      
      const actionError = await page.getByText('Rule requires either');
      expect(actionError).toBeTruthy();
    });
  
    test('should update styling rule and verify visual changes', async ({ page }) => {
      await setupNewDashboard(page);
      
      await page.locator('#flowchart-Router_1-112').getByText('CPU: 7777777777, Memory: ').dblclick();
      await page.getByTestId('data-testid Tab Styling Rules').click();
      await page.getByTestId('data-testid Tab StyleRule1').click();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      
      await page.getByRole('button', { name: 'trash-alt' }).nth(1).click();
      await page.getByRole('button', { name: 'Add Function' }).click();
      await page.getByText('Add apply class').click();
      await page.getByRole('textbox', { name: 'Condition' }).fill('CPU > 0');
      await page.getByText('Select applyClass').click();
      await page.getByText('active', { exact: true }).click();
      await page.getByRole('button', { name: 'Update' }).click();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      
      const updatedNode = await page.locator('#flowchart-Router_1-189 rect').first();
      const fillColor = await updatedNode.evaluate((el) => {
        const computedStyles = window.getComputedStyle(el);
        return computedStyles.fill;
      });
      
      expect(fillColor).toBe('rgb(76, 175, 80)');
    });
  });
