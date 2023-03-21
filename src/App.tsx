import {useState} from 'react'
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cross, Rectangle, Dot} from 'recharts';
import { FormClose } from 'grommet-icons';
import { Grid, Box, SelectMultiple } from 'grommet';

import _ from 'lodash';
import humanNumber from 'human-number'


import './App.css'
import raw_data from '../all-benchmarks.json'

const LIB_LIST = ['Kiddo_v2', 'Kiddo_v1', 'FNNTW', 'pykdtree', 'nabo', 'sklearn', 'scipy'];

const LIB_COLOUR_MAP = {
    Kiddo_v2: 'red',
    Kiddo_v1: 'darkRed',
    FNNTW: 'orange',
    pykdtree: 'green',
    nabo: 'cyan',
    sklearn: 'blue',
    scipy: 'violet',
};

const TYPE_LEGEND_MAP = {
    f32: 'square',
    FXP: 'cross',
    f64: 'circle',
};

const DIM_LABEL_MAP = {
    '2D': '2 2',
    '3D': '',
    '4D': '5 5'
};

const CROSS_SIZE = 4;
const RECT_SIZE = 4;

const customDot = (typeName, invert=false) => (props) => {
    const { cx, cy, stroke, fill, payload, value } = props;
    debugger;
    switch (typeName) {
        case 'f32':
            return <Rectangle x={cx - RECT_SIZE} y={cy - RECT_SIZE} width={RECT_SIZE * 2} height={RECT_SIZE * 2} stroke={invert ? fill : stroke} fill={fill} strokeWidth={1} />;
        case 'FXP':
            return <Cross top={cy-CROSS_SIZE} left={cx-CROSS_SIZE} x={cx} y={cy} width={CROSS_SIZE * 2} height={CROSS_SIZE * 2} stroke={invert ? fill : stroke} fill={fill} strokeWidth={3} />;
        default:
            return <Dot {...props} />;
    }
}

const cartesian =
    (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

const stringToColour = function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function isSelected(dims: str[], types: str[], libs: str[]) {
    return x => (dims.includes(x.dimensionality) && types.includes(x.axis_type) && libs.includes(x.lib));
}

function App() {
    const data = raw_data.map(d => {
        const [test, params, node_qty] = d.id.split('/');
        const [lib, dimensionality, axis_type] = params.split(" ");
        return {
            id: d.id,
            duration: d.mean.estimate / 10e6,
            test,
            node_qty,
            lib,
            dimensionality,
            axis_type
        };
    });

    const data_by_test = Object.entries(_.groupBy(data, 'test'))
        .map(([name, data]) => [name, _.mapValues(_.groupBy(data, 'node_qty'), vals => Object.fromEntries(vals.map(x => [`${x.lib} ${x.dimensionality} ${x.axis_type}`, x])))]);

    const [selectedDims, setSelectedDims] = useState(['3D']);
    const [selectedTypes, setSelectedTypes] = useState(['f64']);
    const [selectedLibs, setSelectedLibs] = useState(LIB_LIST);

    return (
        <div className="App">
            <h1>KD Tree Benchmark</h1>
            <h2>Filters</h2>
            <Grid columns={{count: 3, size: 'auto'}} gap="small">
                <Box>
                    <SelectMultiple
                        placeholder="Dimensions"
                        options={['2D', '3D', '4D']}
                        value={selectedDims}
                        onChange={({ value }) => {
                            setSelectedDims([...value]);
                        }}
                    />
                </Box>
                <Box>
                    <SelectMultiple
                        placeholder="Axis type"
                        options={['f32', 'f64', 'FXP']}
                        value={selectedTypes}
                        onChange={({ value }) => {
                            setSelectedTypes([...value]);
                        }}
                    />
                </Box>
                <Box>
                    <SelectMultiple
                        placeholder="Library"
                        options={LIB_LIST}
                        value={selectedLibs}
                        onChange={({ value }) => {
                            setSelectedLibs([...value]);
                        }}
                    />
                </Box>
            </Grid>
            <div style={{width:"100%",height:800}}>
                { data_by_test.map(([name, data]) => (
                    <div key={name}>
                        <h2>{name}</h2>
                        <Chart data={data} selectedDims={selectedDims} selectedTypes={selectedTypes} selectedLibs={selectedLibs} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Chart({data, selectedDims, selectedTypes, selectedLibs}) {
    const selectedSeriesNames = cartesian(selectedLibs, selectedDims, selectedTypes).map((x => x.join(" ")));

    return (
        <LineChart
            width={1000}
            height={600}
            data={Object.entries(data)}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey={x => humanNumber(Number(x[0]))}/>
            <YAxis scale="log" domain={[1, 'dataMax']} unit="ms"/>
            <Tooltip/>
            <Legend/>
            { selectedSeriesNames.filter(x => !!data["100"][x]).map(name => (
                <Line
                    isAnimationActive={false}
                    key={data["100"][name].id}
                    type="monotoneX"
                    name={name}
                    dataKey={d => d[1][name] ? Number(d[1][name].duration).toPrecision(3) : NaN}
                    stroke={LIB_COLOUR_MAP[data["100"][name].lib]}
                    legendType={TYPE_LEGEND_MAP[data["100"][name].axis_type]}
                    activeDot={customDot(data["100"][name].axis_type, true)}
                    dot={customDot(data["100"][name].axis_type)}
                    strokeDasharray={DIM_LABEL_MAP[data["100"][name].dimensionality]}
                />
            ))}
        </LineChart>
    );
}

export default App
