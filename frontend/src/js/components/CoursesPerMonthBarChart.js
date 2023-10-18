import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import * as d3 from "d3";

const API_URL = process.env.REACT_APP_API_URL;

function CoursesPerMonthBarChart() {

    // useState variables rerender the html everytime there are changed
    const [startDateJson, setStartDateJson] = useState(null);
    const [maxValue, setMaxValue] = useState(null);

    const responseJson = useRef(null);

    // variables for the chart axies
    const xAxiesMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const displayMonths = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    
    // properties of the chart size
    const margin = {top: 20, right: 20, bottom: 50, left: 40},
        width = 500 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const fetchData = async () => {
        const response = await fetch(`${API_URL}/coursesStartDateNoDay?year=${window.year}`);
        responseJson.current = await response.json();
        responseJson.current = responseJson.current.map(listElem => [parseFloat(listElem[0]), parseFloat(listElem[1])])
        setMaxValue(Math.max(...[].concat(...responseJson.current)));

        // map the fetched file in valid format for the charts 
        setStartDateJson(responseJson.current);
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
    var Tooltip = d3.select("#coursesPerMonthBarChart")
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
            .html('"' + displayMonths[d[0] - 1] +'" hat ' + d[1] + ' Kurse.')
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
      
    function drawBarChart(dataset) {

        // creates an svg element with a viewbox of the given chart size
        const svgCoursesPerMonthBarChart = d3.select("#coursesPerMonthBarChart")
            .append("svg")
            .attr("viewBox",`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // create the x axies of the chart
        const xScale = d3.scaleBand()
            .domain(xAxiesMonths)
            .range([0, width])
            .padding(0.05);

        // add the x axies to the svg and set the labels for the axies
        svgCoursesPerMonthBarChart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
                .tickFormat((d,i) => displayMonths[d-1]))
            .selectAll(".tick text")
            .call(wrap, margin.bottom * 2)
            .style("font-size", 10)
            .style("text-anchor", "start")
            .attr("transform", "translate(8, 3) rotate(25)");

        // create the y axies of the chart
        const yScale = d3.scaleLinear()
            .domain([0, maxValue + maxValue * 0.05])
            .range([height, 0]);

        // add y axies to the svg
        svgCoursesPerMonthBarChart.append("g")
            .call(d3.axisLeft(yScale));

        // draw the chart to the svg
        svgCoursesPerMonthBarChart.selectAll()
            .data(dataset)
            .enter()
            .append('rect')
                .attr("x", function (d) { return xScale(d[0]); } )
                .attr("y", function (d) { return yScale(d[1]); } )
                .attr("width", xScale.bandwidth() )
                .attr("height", function (d) { return height - yScale(d[1]); })
                .attr("fill", "#58f")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        // add numbers on top of the bars to the svg
        svgCoursesPerMonthBarChart.selectAll()
            .data(dataset)
            .enter()
            .append('text')
                .attr("x", function(d){ return xScale(d[0]) + xScale.bandwidth() / 2; })
                .attr("y", function(d){ return yScale(d[1]) ; })
                .text(function(d) { return d[1]; })
                .attr("height", function (d) {return height - yScale(d[1]); })
                .attr("font-family" , "sans-serif")
                .attr("font-size" , "10px")
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
        drawBarChart(startDateJson);
    },[startDateJson]);

    // this is what the react component returns as html
    return (
        <div id="coursesPerMonthBarChart">
        </div>
    );
}
const domNode = document.getElementById('courses-month-chart');
const root = createRoot(domNode);
root.render(<CoursesPerMonthBarChart />);
