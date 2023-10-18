import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import * as d3 from "d3";
import categoryColors from "../../json/categoryColors.json";
import displayCategoryNames from "../../json/categoryDisplayNames.json"

const API_URL = process.env.REACT_APP_API_URL;

function CategoryBarChart() {

    // useState variables rerender the html everytime there are changed
    const [startDateJson, setStartDateJson] = useState(null);

    const responseJson = useRef(null);

    // properties of the chart size
    const margin = {top: 20, right: 20, bottom: 50, left: 40},
        width = 350 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    const fetchData = async () => {
        const response = await fetch(`${API_URL}/getLocations?year=${window.year}`);
        responseJson.current = await response.json();

        // maps the fetched json file in valid format for the charts 
        var jsonAsList = Object.keys(responseJson.current).map( key => [key, responseJson.current[key].length]);
        jsonAsList = jsonAsList.sort((a, b) => b[1]- a[1]);

        setStartDateJson(jsonAsList);
    }

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

    /******* Functions for to create hover effect of the bars *******/

    // creating html element that shows up when one hovers over a bar
    var Tooltip = d3.select("#categoryBarChart")
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
        .html('"' + displayCategoryNames[d[0]] +'" hat ' + d[1] + ' Kurse.')
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
    /****************************************************************/
      
    // this function creates the chart with the given dataset
    function drawHeatMap(dataset) {

        // creates an svg element with a viewbox of the given chart size
        const svgCategoryBarChart = d3.select("#categoryBarChart")
            .append("svg")
            .attr("viewBox",`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // create the x axies of the chart
        const xScale = d3.scaleBand()
            .domain(dataset.map(item => item[0]))
            .range([0, width])
            .padding(0.05);

        // add the x axies to the svg and set the labels for the axies
        svgCategoryBarChart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
            .tickFormat((d,i) => displayCategoryNames[d]))
            .selectAll(".tick text")
            .call(wrap, margin.bottom * 2)
            .style("font-size", 10)
            .style("text-anchor", "start")
            .attr("transform", "translate(8, 3) rotate(25)");
            
        // create the y axies of the chart
        const yScale = d3.scaleLinear()
            .domain([0, dataset[0][1] + dataset[0][1] * 0.05]) // makes the chart 5% bigger than highest value
            .range([height, 0]);
            
        // add y axies to the svg
        svgCategoryBarChart.append("g")
            .call(d3.axisLeft(yScale));

        // draw the chart to the svg
        svgCategoryBarChart.selectAll()
            .data(dataset)
            .enter()
            .append('rect')
                .attr("x", function (d) { return xScale(d[0]); } )
                .attr("y", function (d) { return yScale(d[1]); } )
                .attr("width", xScale.bandwidth() )
                .attr("height", function (d) {return height - yScale(d[1]); })
                .attr("fill", function (d) { return categoryColors[d[0]]})
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        // add numbers on top of the bars to the svg
        svgCategoryBarChart.selectAll()
            .data(dataset)
            .enter()
            .append('text')
                .attr("x", function(d){ return xScale(d[0]) + xScale.bandwidth() / 2; })
                .attr("y", function(d){ return yScale(d[1]) ; })
                .text(function(d) { return d[1]; })
                .attr("height", function (d) {return height - yScale(d[1]); })
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
        if (!startDateJson) return;
        drawHeatMap(startDateJson);
        
    },[startDateJson]);

    // this is what the react component returns as html
    return (<div id="categoryBarChart">
    </div>);
}

const domNode = document.getElementById('category-bar-chart');
const root = createRoot(domNode);
root.render(<CategoryBarChart />);
