import React, { useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';

const API_URL = process.env.REACT_APP_API_URL;
    
// React component of the 4 general numbers on top of the dashboard
function GeneralNumbers() {
  
  // useState variables rerender the html everytime there are changed
  const [generalNumbers,setGeneralNumbers] = useState([]);

  const fetchGeneralData = async () => {
    const response = await fetch(`${API_URL}/generalData?year=${window.year}`);
    setGeneralNumbers(await response.json());
  }

  // called once the page is opend
  useEffect(() => {
    fetchGeneralData()
  },[]);
  
  // this is what the react component returns as html
  return(
    <div className="row">
      <div className="col-xxl-12 d-flex">
        <div className="w-100">
          <div className="row">
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col mt-0">
                      <h5 className="card-title">Gesamtanzahl an Kursen</h5>
                    </div>

                    <div className="col-auto">
                      <div className="stat text-primary">
                        <i className="align-middle" data-feather="book"></i>
                      </div>
                    </div>
                  </div>
                  <h1 className="mt-1 mb-3">{generalNumbers[0]}</h1>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col mt-0">
                      <h5 className="card-title">Anzahl an Städten mit Kursen</h5>
                    </div>

                    <div className="col-auto">
                      <div className="stat text-primary">
                        <i className="align-middle" data-feather="home"></i>
                      </div>
                    </div>
                  </div>
                  <h1 className="mt-1 mb-3">{generalNumbers[1]}</h1>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col mt-0">
                      <h5 className="card-title">Anzahl an Onlinekursen</h5>
                    </div>

                    <div className="col-auto">
                      <div className="stat text-primary">
                        <i className="align-middle" data-feather="monitor"></i>
                      </div>
                    </div>
                  </div>
                  <h1 className="mt-1 mb-3">{generalNumbers[2]}</h1>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col mt-0">
                      <h5 className="card-title">Anzahl an Kursanbietern</h5>
                    </div>

                    <div className="col-auto">
                      <div className="stat text-primary">
                        <i className="align-middle" data-feather="globe"></i>
                      </div>
                    </div>
                  </div>
                  <h1 className="mt-1 mb-3">{generalNumbers[3]}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const domNode = document.getElementById('general-number-cards');
const root = createRoot(domNode);
root.render(<GeneralNumbers />);





