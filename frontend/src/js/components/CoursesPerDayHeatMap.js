import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import * as d3 from "d3";

const API_URL = process.env.REACT_APP_API_URL;

// constant variables used for the axies of the chart
const axisLabels = ["Jan","Feb","Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dez"];
const xAxisValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const yAxisValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]

// properties of the chart size
const margin = {top: 10, right: 10, bottom: 55, left: 50},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    // properties of the legend
    legendMarginTop = 25,
    legendBarWidh = 100,
    legendBarHeight = 10;

function HeatMap() {

    // useState variables rerender the html everytime there are changed
    const [fetchedDataset, setFetchedDataset] = useState(null);

    const responseJson = useRef(null);

    const fetchData = async () => {
        const response = await fetch(`${API_URL}/coursesStartDateNoYear?year=${window.year}`);
        responseJson.current = await response.json();

        // maps the fetched file in valid format for the charts 
        setFetchedDataset(responseJson.current.map( startDate => [parseInt(startDate[0].split("-")[0]), parseInt(startDate[0].split("-")[1]), parseInt(startDate[1])]));
    }

    /**************************Animation on mouseover*******************************/
    
    // creating html element that shows up when one hovering over
    var Tooltip = d3.select("#coursesPerDayHeatmap")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "1px")
        .style("padding", "1px")

    var mouseover = function(d) {
        Tooltip
          .style("opacity", 0.7)
        d3.select(this)
          .style("stroke", "grey")
          .style("opacity", 0.5)
      }
    var mousemove = function(event, d) {
    Tooltip
        .html("Am " + d[1] + ". "+  axisLabels[d[0] - 1] +" finden " + d[2] + " Kurse statt")
        .style("left", (d3.pointer(event,this)[0]) + "px")
        .style("top", (d3.pointer(event, this)[1]) + "px")
    }
    var mouseleave = function(d) {
    Tooltip
        .style("opacity", 0)
    d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }
    /********************************************************************************/

    function drawHeatMap(dataset) {
        
        // creates an svg element with a viewbox of the given chart size
        const svg = d3.select("#coursesPerDayHeatmap")
            .append("svg")
            .attr("viewBox",`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // create a legend svg
        var defs = svg.append("defs");

        var gradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#F8F9FF");
        gradient.append("stop")
            .attr("offset", "20%")
            .attr("stop-color", "#42A5F5");
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#0D47A1"); 
        
        // draws the legend to the svg
        svg.append("rect")
            .attr("x", 0)
            .attr("y", height + legendMarginTop)
            .attr("width", legendBarWidh)
            .attr("height", legendBarHeight)
            .style("fill", "url(#linear-gradient)")
            .style("stroke", "black")
            .attr("stroke-width", 0.2)
            .selectAll('stop')
            .data(dataset)
            .enter()
            .append('stop')
            .attr('offset',function(d) { return 0; })
            .attr('stop-color', function(d) {return function (d) { return valueToColor(d[2]); }})

        // Y Axies label
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(-30,' + height/2 + ')rotate(-90)')
            .style('font-family', 'Helvetica')
            .style('font-size', 12)
            .text('Day in Month');

        // draw the heatmap
        const x = d3.scaleBand()
            .domain(xAxisValues)
            .range([0, width])
            .padding(0.05);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x)
            .tickFormat((d,i) => axisLabels[i]));

        // create the y axies of the chart
        const y = d3.scaleBand()
            .domain(yAxisValues)
            .range([ height, 0])
            .padding(0.05);

        // add y axies to the svg
        svg.append("g")
            .call(d3.axisLeft(y));        
        
        // creates the range of the colour depending on the data values:
        // the biggest number of the data value will be the darkest colour.
        // 20% of the biggest number will be middle dark colour.
        // the rest of the numbers will scale automatically depending on theire 
        // value between these colours.
        const valueToColor = d3.scaleLinear()
            .range(["#F8F9FF", "#42A5F5","#0D47A1"])
            .domain([
                        0, 
                        d3.max(dataset, function(d) { return d[2]; }) / 5,
                        d3.max(dataset, function(d) { return d[2]; })
                    ]);
        
        // create the value of the legend depending on the dataset biggest value
        var legendAxiesScale = d3.scaleLinear()
            .domain([0, d3.max(dataset, function(d) { return d[2]; })])
            .range([0, legendBarWidh]);

        // create the label for the legend with the value of dataset at 20% and 100% of the legend
        var legendAxisLabelTicks = d3.axisBottom(legendAxiesScale)
            .tickValues(valueToColor.domain())
                  
        // append the legend to the main svg
        svg.append("g")
            .attr("class", "label-axis")
            .attr("transform", `translate(0, ${height + legendMarginTop + legendBarHeight})`)
            .datum(dataset)
            .call(legendAxisLabelTicks);

        // draw the chart to the svg
        svg.selectAll()
            .data(dataset)
            .enter()
            .append('rect')
                .attr("x", function (d) { return x(d[0]); } )
                .attr("y", function (d) { return y(d[1]); } )
                .attr("width", x.bandwidth() )
                .attr("height", y.bandwidth() )
                .style("fill",  function (d)  { return valueToColor(d[2]); } )
                .style("stroke-width", 1)
                .style("stroke", "none")
                .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

    }

    // this function is called once before the webpage is loaded
    useEffect(() => {
        fetchData();
      },[]);

    // this function is called once if if the data is fetched
    useEffect(() => {
        if (!fetchedDataset) return;
        drawHeatMap(fetchedDataset);
    },[fetchedDataset]);

    // this is what the react component returns as html
    return (
        <div id="coursesPerDayHeatmap" className="fullwidth">
        </div>
    );
}

const domNode = document.getElementById('heat-map');
const root = createRoot(domNode);
root.render(<HeatMap />);
