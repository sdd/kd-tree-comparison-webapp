import {useState} from 'react'
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import { FormClose } from 'grommet-icons';
import { Box, Button, Text, SelectMultiple } from 'grommet';

import _ from 'lodash';

import './App.css'
import raw_data from '../all-benchmarks.json'


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
        .map(([name, data]) => [name, _.groupBy(data, 'node_qty')]);

    const [selectedDims, setSelectedDims] = useState(['3D']);
    const [selectedTypes, setSelectedTypes] = useState(['f64']);
    const [selectedLibs, setSelectedLibs] = useState(['Kiddo_v2', 'Kiddo_v1', 'FNNTW', 'pykdtree']);

    return (
        <div className="App">
            <h1>KD Tree Benchmark</h1>
            <SelectMultiple
                placeholder="Dimensions"
                options={['2D', '3D', '4D']}
                value={selectedDims}
                onChange={({ value }) => {
                    setSelectedDims([...value]);
                }}
            />
            <SelectMultiple
                placeholder="Axis type"
                options={['f32', 'f64', 'FXP']}
                value={selectedTypes}
                onChange={({ value }) => {
                    setSelectedTypes([...value]);
                }}
            />
            <SelectMultiple
                placeholder="Library"
                options={['Kiddo_v2', 'Kiddo_v1', 'FNNTW', 'pykdtree']}
                value={selectedLibs}
                onChange={({ value }) => {
                    setSelectedLibs([...value]);
                }}
            />
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
            <XAxis dataKey={x => x[0]}/>
            <YAxis scale="log" domain={[1, 'dataMax']}/>
            <Tooltip/>
            <Legend/>
            { data['100']
                .filter(x => { debugger; return isSelected(selectedDims, selectedTypes, selectedLibs)(x); })
                .map((datum, idx) => (
                <Line key={idx} type="monotoneX" name={`${datum.lib} ${datum.dimensionality} ${datum.axis_type}`} dataKey={d => d[1][idx] ? Number(d[1][idx].duration).toPrecision(3) : NaN} stroke={stringToColour(`${datum.lib} ${datum.dimensionality} ${datum.axis_type}`)} />
            ))}
        </LineChart>
    );
}

export default App
