import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { createRoot } from 'react-dom/client';

const API_URL = process.env.REACT_APP_API_URL;

function ProvidersBarChart() {

    // useState variables rerender the html everytime there are changed
    const [fetchedDataset, setFetchedDataset] = useState(null);

    const responseJson = useRef(null);

    // this variable sets the number of providers that are shown in the chart
    const ammountOfShownProvider = 10; 

    // properties of the chart size
    const margin = {top: 20, right: 50, bottom: 130, left: 35},
        width = 500 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const fetchData = async () => {
        const response = await fetch(`${API_URL}/coursesProvider?year=${window.year}`);
        responseJson.current = await response.json();

        // map the fetched file in valid format for the charts 
        setFetchedDataset(responseJson.current.map(listElem => [listElem[0], parseFloat(listElem[1])]));
    }

    /******* Functions for to create hover effect of the bars *******/

    // creating html element that shows up when one hovers over a bar   
    var Tooltip = d3.select("#providersBarChart")
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
            .html('"' + d[0] +'" hat ' + d[1] + ' Kurse')
            .style("left", (d3.pointer(event,this)[0]) + "px")
            .style("top", (d3.pointer(event, this)[1]) + "px")
    }
    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1)
    }
    /********************************************************************************/

    // function I took from the internet to wrap up the text in box with the given width,
    // instead of writing everything in one long line
    function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 0.8,
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
    }

    // this function creates the chart with the given dataset
    function drawBarChart(dataset) {
        
        // creates an svg element with a viewbox of the given chart size
        const svg = d3.select("#providersBarChart")
            .append("svg")
            .attr("viewBox",`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // create the x axies of the chart
        const x = d3.scaleBand()
            .domain(dataset.map(item => item[0]))
            .range([0, width])
            .padding(0.05);
           
        // add the x axies to the svg and set the labels for the axies
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x)) 
            .selectAll(".tick text")
            .call(wrap, margin.bottom * 1.35)
            .style("font-size", 8)
            .style("text-anchor", "start")
            .attr("transform", "translate(8, 3) rotate(60)");

        // create the y axies of the chart
        const y = d3.scaleLinear()
            .domain([0, dataset[0][1] + dataset[0][1] * 0.05]) // makes the chart 5% bigger than highest value
            .range([height, 0]);

        // add y axies to the svg
        svg.append("g")
            .call(d3.axisLeft(y));
        
        // draw the chart to the svg
        svg.selectAll()
            .data(dataset)
            .enter()
            .append('rect')
                .attr("x", function (d) { return x(d[0]); } )
                .attr("y", function (d) { return y(d[1]); } )
                .attr("width", x.bandwidth() )
                .attr("height", function (d) {return height - y(d[1]); })
                .attr("fill", "#58f")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        // following part shows the numbers on top of the bars
        svg.selectAll()
            .data(dataset)
            .enter()
            .append("text")
                .attr("x", function(d){ return x(d[0]) + x.bandwidth() / 2; })
                .attr("y", function(d){ return y(d[1]) ; })
                .text(function(d) { return d[1]; })
                .attr("font-family" , "sans-serif")
                .attr("font-size" , "8px")
                .attr("fill" , "black")
                .attr("text-anchor", "middle");

    }

    // this function is called once before the webpage is loaded
    useEffect(() => {
        fetchData();
      },[]);

    // this function is called once if if the data is fetched
    useEffect(() => {
        if (!fetchedDataset) return;
        drawBarChart(fetchedDataset.slice(0,ammountOfShownProvider));
        
    },[fetchedDataset]);

    // this is what the react component returns as html
    return (<div id="providersBarChart">
    </div>);
}
const domNode = document.getElementById('providers-bar-chart');
const root = createRoot(domNode);
root.render(<ProvidersBarChart />);
