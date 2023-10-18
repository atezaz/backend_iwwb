import React, {Component, useEffect, useState, useRef} from 'react';
import WordCloud from 'react-d3-cloud';
import { createRoot } from 'react-dom/client';

const API_URL = process.env.REACT_APP_API_URL;
    
function WordCloudComponent() {

  // useState variables rerender the html everytime there are changed
  const [data,setData] = useState([]);

  const wordcloudDataRaw = useRef([]);
  const biggestValue = useRef(0)

  // function to adapt the value depending to a percentage like value
  // so that the size of the wordcloud is not getting very small if
  // the values are all small.
  function transformValueToPercentage(list) {
    biggestValue.current = parseFloat(list[0][1]);

    list.forEach(word => word[1] = (parseFloat((word[1]) / biggestValue.current) * 100));
    return list
  }

  // change the fetched data to the type that the chart needs to work
  function transformDataForCloud(listWithLists) {
    let dataForCloud = [];
    listWithLists = Array.from(listWithLists);
    listWithLists = transformValueToPercentage(listWithLists)
    dataForCloud = listWithLists.map(item => ({text: item[0], value: parseFloat(item[1])}));
    setData(dataForCloud);
  }

  function fetchWordCloudData() {
      fetch(`${API_URL}/wordsCount?year=${window.year}`)
        .then( (res) => res.json())
        .then( (data) => { wordcloudDataRaw.current = data; 
                          transformDataForCloud(wordcloudDataRaw.current);
                        })
        .catch( (err) => console.log("wordcloud error: " + err) );
  }

  // called once the page is opend
  useEffect(() => {
    fetchWordCloudData()
  },[]);
  
  
  return(
    <div>
      <WordCloud 
        height={700}
        width={700}
        fontSize={(word) => (word.value < 12 ? 12 : word.value)} // minimum size of a word is 12
        spiral="archimedean"
        rotate={() => ((Math.round(Math.random() * 100 ) % 2) * 90)}
        padding={2} 
        data={data} 
        random={Math.random} 
        fontWeight="540"
        // following part is showing the amount when hover over a word:
        onWordMouseOver={(event, word) => {
          var wordCount = 0;
          wordCount = Math.round(parseFloat(word.value) /100 * biggestValue.current)

          document.getElementById('wordHover').innerHTML = word.text + ': ' + wordCount;
          document.getElementById('wordHover').style.display='block';
        }}
        onWordMouseOut={(event, d) => {
          document.getElementById('wordHover').style.display='none';
        }}
      />
      <div id='wordHover' style={{position:"absolute", display:"none", overflow:"hidden"}}></div>
    </div>
  );
}

const domNode = document.getElementById('wordcloud');
const root = createRoot(domNode);
root.render(<WordCloudComponent />);


