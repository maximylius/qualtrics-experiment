Qualtrics.SurveyEngine.addOnload(function()
{
    /**
     * Inserts slider and various UI outputs (Bars, Numbers) into DOM
     * 
     * How to modify outputs:
     *  
     *  
     * n: number of other participants in experiment (n+1=total number of participants)
     * endow: individual endowment
     * full_future: 120 (value of FA if no crisis happened)
     * crisis_param, crisis_mult: future account = (crisis_parameter + contr * ( Total_Contr / Max_Contribution ) ) * full_future 
     * configure slider attributes: min, max, start values and step size
     * 
     * 
     * ROADMAP:
     * make crisis_param dependent on experiment
     * make sure n+1=20 is correct
     * improve styling: add borders, maybe grid markers, improve number layout and rethink positioning
     *  
     * */ 
    const vals = {
        n: 19,
        endow: 30,
        full_future: 90,
        crisis_param: 0.1,
        contr_mult: 0.4

    };
	window.vals = vals;

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

    /* hide question where data from slider movement shall be saved and bin question to vals */
    vals.questions = [];
    types.QUESTION_IDS.forEach(question_id => {
        document.getElementById(question_id).style.display = 'none';
        vals.questions.push(document.getElementById(question_id).querySelector('input'));
    });
    
     
    
    /* define parent elements */
    vals.uiOutputs = [
        /* contribution slider inputs */
        {
            parent: document.getElementById(types.INPUT_TABLE_ID).firstElementChild.children[1].firstElementChild,
            type: types.CONTR,
            subj: types.YOU ,
            slider: true,
            bar: false,
            value: true,
            max: false
        },
        {
            parent: document.getElementById(types.INPUT_TABLE_ID).firstElementChild.children[3].firstElementChild,
            type: types.CONTR,
            subj: types.OTHER ,
            slider: true,
            bar: false,
            value: true,
            max: false
        },
        /* account bar OR number outputs */
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[1].children[0],
            type: types.CURR,
            subj: types.YOU,
            slider: false,
            bar: true,
            value: true,
            max: true
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[1].children[1],
            type: types.CURR,
            subj: types.OTHER ,
            slider: false,
            bar: true,
            value: true,
            max: true
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[2].children[0],
            type: types.FUT,
            subj: types.YOU ,
            slider: false,
            bar: true,
            value: true,
            max: true,
            barBackgroundColor: 'red'
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[2].children[1],
            type: types.FUT,
            subj: types.OTHER,
            slider: false,
            bar: true,
            value: true,
            max: true,
            barBackgroundColor: 'red'
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[3].children[0],
            type: types.TOT,
            subj: types.YOU ,
            slider: false,
            bar: false,
            value: true,
            max: false
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_ID).firstElementChild.children[3].children[1],
            type: types.TOT,
            subj: types.OTHER,
            slider: false,
            bar: false,
            value: true,
            max: false
        },
        /* Group totals */
        {
            parent: document.getElementById(types.OUTPUT_TABLE_2_ID).firstElementChild.children[1].children[0],
            type: types.TOT,
            subj: types.ALL ,
            slider: false,
            bar: true,
            value: true,
            max: false
        },
        {
            parent: document.getElementById(types.OUTPUT_TABLE_2_ID).firstElementChild.children[1].children[1],
            type: types.DMG,
            subj: types.ALL,
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

    /** create fcts: 
     * updateAccounts, createBar, createSpanNumber, getValue, getDec, updateUI, sliderListener, createSlider, 
     * */ 

    /* updates currrent account (curr), future account (fut), total account (tot) according to contribution input */
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
        barInner.id = 'output-bar-inner-'+barObj.id;

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
                // update bar
                uiOutput.bar.style.width = vals.uiWidth[uiOutput.type][uiOutput.subj];
            };

            if(uiOutput.value != false){
                // update value
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
        /* save slider movements, if question is full (20,000 chars) save to next question is full, if all full dont save. */
        const question = vals.questions.filter(question => question.value.length < 20000-50)[0]
        if(question) {
            let currentTimeSliderPosition = "t" + (Date.now() - vals.t0) + "y" + vals.contr.you.value + "o" + vals.contr.other.value + ";";
            question.value = question.value + currentTimeSliderPosition;
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

    /**
     * Initialize accounts, uiOutputs, sliders
     */

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

    /* add sliders to ui */
    vals.uiOutputs.filter(uiOutput => uiOutput.slider != false).forEach(uiOutput => {
        vals.uiOutputs[uiOutput.index].slider =  createSlider(vals.contr[uiOutput.subj], uiOutput.subj);
        uiOutput.parent.insertBefore(vals.uiOutputs[uiOutput.index].slider, uiOutput.parent.firstElementChild);
    });

});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/
    Array.from(document.querySelectorAll(".Separator")).forEach(div => {
        div.style.display = 'none'
    })
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});