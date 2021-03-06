/**
 * ### ### Inserts slider and various UI outputs (Bars, Numbers) into DOM when page loads ### ###
 * 
 * 
 * ### Variables to define for experiment: ### 
 *  
 * n: number of other participants in experiment (n+1=total number of participants)
 * endow: individual endowment
 * full_future: 120 (value of FA if no crisis happened)
 * crisis_param, crisis_mult: futureAccount = (crisis_parameter + contr * ( Total_Contr / Max_Contribution ) ) * full_future 
 * configure slider attributes: min, max, start values and step size
 * 
 * 
 * ### How to modify ui outputs: ### 
 * if the output is prepared already adjust in vals.uiOutputs array: 
 * - true or false options (for slider, bar, value, max) to add or remove output 
 * - or adjust color by adding barBackgroundColor, barForegroundColor options as color strings
 * if new output is required then add object to output array and 
 * define in vals output attributes for accounts, uiWidth and adjust updateAccounts() and updateUI()
 * 
 * ### To-Dos: ###
 * make crisis_param dependent on treatment
 * discuss start values for contribution and whether they should be the same accross participants.
 * improve styling: add borders, maybe grid markers, improve number layout and rethink positioning
 * remove binding of vals object to window from final version
 * add unit ECU behind number. Check decimals places.
 * add explanation for bars for future account: green fut that survives crisis, red fut that is destroyed by crisis.
 * make sure height does not exceed screeen height (especially on mobile)
 * what other vars shall be observed (total time spent on page, deivice type) 
 * make sure wording is understandable
 * 
 * */ 
Qualtrics.SurveyEngine.addOnload(function()
{
    /* create object (and bind to window in test phase) for easy access of state values */
    const vals = {
        n: 19,
        endow: 30,
        full_future: 90,
        crisis_param: 0.1,
        contr_mult: 0.4

    };
	window.vals = vals;

    /* create types to help insure consistent use */
    const types = {
        /* subj: */
        YOU: 'you',
        OTHER: 'other',
        ALL: 'all',
        /* type: */
        CONTR: 'contr',
        ACC: 'acc',
        CURR: 'curr',
        FUT: 'fut',
        TOT: 'tot',
        DMG: 'dmg',
        /* IDs */
        INPUT_TABLE_ID: 'input-table',
        OUTPUT_TABLE_ID: 'output-table',
        OUTPUT_TABLE_2_ID: 'output-table-2',
        QUESTION_IDS: ["QID26", "QID27", "QID28", "QID29", "QID30"],
        /* default bar colors */
        BAR_FOREGROUND_COLOR_DEFAULT: 'green',
        BAR_BACKGROUND_COLOR_DEFAULT: 'transparent'
    };

    /* hide question to which data from slider movement shall be saved. Add dataStorageFields to vals object */
    vals.dataStorageFields = [];
    types.QUESTION_IDS.forEach(question_id => {
        document.getElementById(question_id).style.display = 'none';
        vals.dataStorageFields.push(document.getElementById(question_id).querySelector('input'));
    });
    
     
    
    /** uiOutputs: 
     * define parent elements, 
     * set type and subj, 
     * set which ui elements shall be created (slider, bars, value, max)
     * set color of bars barBackgroundColor, barForegroundColor
     */
    vals.uiOutputs = [
        /* contribution slider inputs */
        {
            type: types.CONTR,
            subj: types.YOU ,
            parent: document.getElementById(types.INPUT_TABLE_ID).firstElementChild.children[1].firstElementChild,
            slider: true,
            bar: false,
            value: true,
            max: false
        },
        {
            type: types.CONTR,
            subj: types.OTHER ,
            parent: document.getElementById(types.INPUT_TABLE_ID).firstElementChild.children[3].firstElementChild,
            slider: true,
            bar: false,
            value: true,
            max: false
        },
        /* account bar OR number outputs */
        {
            type: types.CURR,
            subj: types.YOU,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[1].children[0],
            slider: false,
            bar: true,
            value: true,
            max: true
        },
        {
            type: types.CURR,
            subj: types.OTHER ,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[1].children[1],
            slider: false,
            bar: true,
            value: true,
            max: true
        },
        {
            type: types.FUT,
            subj: types.YOU ,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[2].children[0],
            slider: false,
            bar: true,
            value: true,
            max: true,
            barBackgroundColor: 'red'
        },
        {
            type: types.FUT,
            subj: types.OTHER,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[2].children[1],
            slider: false,
            bar: true,
            value: true,
            max: true,
            barBackgroundColor: 'red'
        },
        {
            type: types.TOT,
            subj: types.YOU ,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[3].children[0],
            slider: false,
            bar: false,
            value: true,
            max: false
        },
        {
            type: types.TOT,
            subj: types.OTHER,
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[3].children[1],
            slider: false,
            bar: false,
            value: true,
            max: false
        },
        /* Group totals */
        {
            type: types.TOT,
            subj: types.ALL ,
            parent: document.getElementById(types.OUTPUT_TABLE_2_ID).firstElementChild.children[1].children[0],
            slider: false,
            bar: true,
            value: true,
            max: false
        },
        {
            type: types.DMG,
            subj: types.ALL,
            parent: document.getElementById(types.OUTPUT_TABLE_2_ID).firstElementChild.children[1].children[1],
            slider: false,
            bar: true,
            value: true,
            max: false,
            barBackgroundColor: 'transparent',
            barForegroundColor: 'red'
        },
    ].map((el, index) => {
        el.index = index;
        return el;
    });

    

    /* complete vals object */
    vals.t0 = Date.now();
    vals.contr = {  
        you: {
            min: 0,
            max: vals.endow,
            start: vals.endow/2,
            value: vals.endow/2,
            step: 0.5
        }
    }
    vals.contr.other = {
        min: vals.contr.you.min * vals.n,
        max: vals.contr.you.max * vals.n,
        start: vals.contr.you.start * vals.n,
        value: vals.contr.you.value * vals.n,
        step: vals.contr.you.step * vals.n
    };

    /** #### #### #### create functions #### #### #### */ 

    /** contains main experiment logic 
     * 
     * updates (according to own and other contribution input):
     * - currrent account (curr), 
     * - future account (fut), 
     * - total account (tot) 
     * - total crisi damage (dmg) 
     * 
     * also updates uiWidth (for bars) as a percentage of maximum value
     */
    const updateAccounts = () => {
        const contr = vals.contr;
        
        const curr = {
            you: contr.you.max - contr.you.value,
            other: (contr.other.max - contr.other.value) / vals.n
        };

        const fut = vals.full_future * (
                vals.crisis_param + 
                vals.contr_mult * (contr.you.value + contr.other.value) / 
                ( (vals.n+1) * contr.you.max) 
            );
        
        const tot = {
            you: curr.you + fut,
            other: curr.other + fut,
            all: curr.you + vals.n * curr.other + (vals.n + 1) * fut
        };

        const dmg = {
            all: (vals.n + 1) * (vals.full_future - fut)
        }

        vals.acc = {
            curr: curr,
            fut: {you: fut, other: fut},
            tot: tot,
            dmg: dmg
        }

        const maxTot = contr.you.max - 0 + ( (vals.crisis_param + vals.contr_mult * vals.n / (vals.n + 1)) * vals.full_future ) 

        vals.uiWidth = {
            curr: {
                you: (100 * ( contr.you.max - contr.you.value ) / contr.you.max) + '%',
                other: (100 * ( contr.other.max - contr.other.value ) / contr.other.max) + '%'
            },
            fut: {
                you: (100 * vals.acc.fut.you / vals.full_future) + '%',
                other: (100 * vals.acc.fut.other / vals.full_future) + '%'
            },
            tot: {
                you: 100 * tot.you / maxTot + '%',
                other: 100 * tot.other / maxTot + '%',
                all:  100 * (tot.you + vals.n * tot.other) / 
                ( (vals.n + 1) * vals.full_future * (vals.crisis_param + 1 * vals.contr_mult)  ) + '%'
            },
            dmg: {
                all: 100 * (vals.full_future - fut) / vals.full_future + '%'
            }
        };
    };


    const createBar = (barObj) => {
        const barContainer = document.createElement('div');
	    const barInner = document.createElement('div');
        barInner.id = 'output-bar-inner-' + barObj.id;

        barContainer.style.width = barObj.scale * 90 + '%';
        barContainer.style.height = '1rem';
        barContainer.style.backgroundColor = barObj.backgroundColor;
        // barContainer.style.border = '0.1rem solid black';
        barContainer.style.marginLeft = '5%';
        barContainer.style.marginRight = '5%';

        barInner.style.width = barObj.width;
        barInner.style.height = '100%';
        barInner.style.backgroundColor = barObj.foregroundColor;
        // barInner.style.marginLeft = '-0.1rem';
        // barInner.style.marginTop = '-0.1rem';
        // barInner.style.border = '0.1rem solid black';

        
        if(barObj.gridScale){
            let n = 5
            for(let i = 0; i < n; i++){
                const section = document.createElement('div');
                section.style.width =  100/n + '%';
                section.style.height = '1rem';
                section.style.border = '0.1rem solid black';
                barContainer.append(section)
            };
        };

        barContainer.appendChild(barInner);

        return {barContainer, barInner};
    };

    const createSpanNumber = (num) => {
        const numDiv = document.createElement('span');
        numDiv.innerText = num;
        return numDiv;
    };
    
    const getValue = (type, subj) => {
        return type == types.CONTR ? 
            subj == types.YOU ? 
                vals.contr[subj].value : 
                    vals.contr[subj].value / vals.n :  
            vals.acc[type][subj];
    };
    
    const getDec = (type) => {
        return type == types.CONTR ? 2 : 2
    }

    const updateUI = () => {
        vals.uiOutputs = vals.uiOutputs.map(uiOutput => {
            if(uiOutput.bar != false){
                /* update bar */ 
                uiOutput.bar.style.width = vals.uiWidth[uiOutput.type][uiOutput.subj];
            };

            if(uiOutput.value != false){
                /* update current value in span */ 
                const value = getValue(uiOutput.type, uiOutput.subj);    
                const dec = getDec(uiOutput.type);    
                uiOutput.value.innerText = value.toFixed(dec);
            };

            return uiOutput;
        });
    };

    /* updates UI with new account values */
    const sliderListener = (e,type) => {
        /* update contribution of changed slider input */
        vals.contr[type].value = parseFloat(e.target.value);
        /* update account values and bar percentages */
        updateAccounts();
        /* update width of inner bars in UI*/
        updateUI();
        /* save slider movements, if dataStorageField is full (20,000 chars) save to next dataStorageField, if all full dont save. */
        const dataStorageField = vals.dataStorageFields.filter(dataStorageField => dataStorageField.value.length < 20000-50)[0]
        if(dataStorageField) {
            let currentTimeSliderPosition = "t" + (Date.now() - vals.t0) + "y" + vals.contr.you.value + "o" + vals.contr.other.value + ";";
            dataStorageField.value = dataStorageField.value + currentTimeSliderPosition;
        };
    };

	
    const createSlider = (sliderAttr, type) => {
        /** 
        * input: e is event, type either 'you' or 'other'
        * fct: updates UI with new account values
        */
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = sliderAttr.min;
        slider.max = sliderAttr.max; 
        slider.value = sliderAttr.start;
        slider.step = sliderAttr.step;
        slider.style.width = "70%";
        slider.oninput = (e) => sliderListener(e, type)

        return slider;
    };



    /** #### #### #### Initialize accounts, uiOutputs, sliders #### #### #### */

    /* intialize accounts */
    updateAccounts();

    /* initialize uiOutputs */ 
    vals.uiOutputs = vals.uiOutputs.map(uiOutput => {
        if(uiOutput.bar == true){
            /* create bar */
            const {barContainer, barInner} = createBar({
                id: uiOutput.type + '-' + uiOutput.subj,
                width: vals.uiWidth[uiOutput.type][uiOutput.subj],
                scale: uiOutput.type == types.CURR ? 1/3 : 1,
                foregroundColor: uiOutput.barForegroundColor || types.BAR_FOREGROUND_COLOR_DEFAULT,
                backgroundColor: uiOutput.barBackgroundColor || types.BAR_BACKGROUND_COLOR_DEFAULT,
                gridScale: null
            })

            uiOutput.parent.appendChild(barContainer);
            uiOutput.bar = barInner
        };

        if(uiOutput.value == true){
            /* create span for current value */
            const value = getValue(uiOutput.type, uiOutput.subj);    
            const dec = getDec(uiOutput.type);    
            uiOutput.value = createSpanNumber(value.toFixed(dec))
            uiOutput.parent.appendChild(uiOutput.value);
        };

        if(uiOutput.max == true) {
            /* create span for maximum value */
            const max = uiOutput.type == types.CURR ? 
                vals.contr.you.max : uiOutput.type == types.FUT ? 
                    vals.full_future : uiOutput.type == types.TOT ?  
                        vals.contr.you.max + vals.full_future * (vals.crisis_param + vals.contr_mult * vals.n / (vals.n + 1)) : 
                    0;
            
            const numDiv = createSpanNumber(max.toFixed(0));
            const seperatorDiv = document.createElement('span');
            seperatorDiv.innerText = ' / ';

            uiOutput.max = numDiv;
            uiOutput.parent.appendChild(seperatorDiv);
            uiOutput.parent.appendChild(uiOutput.max);
        };

        return uiOutput;
    });

    /* add sliders to ui, insert as first child */
    vals.uiOutputs.filter(uiOutput => uiOutput.slider != false).forEach(uiOutput => {
        const slider = createSlider(vals.contr[uiOutput.subj], uiOutput.subj);
        vals.uiOutputs[uiOutput.index].slider = slider;
        uiOutput.parent.insertBefore(slider, uiOutput.parent.firstElementChild);
    });

});


/*Place your JavaScript here to run when the page is fully displayed*/
Qualtrics.SurveyEngine.addOnReady(function()
{
    /* removes all question Seperators from page */
    Array.from(document.querySelectorAll(".Separator")).forEach(div => {
        div.style.display = 'none'
    })
});


/*Place your JavaScript here to run when the page is unloaded*/
Qualtrics.SurveyEngine.addOnUnload(function() {});