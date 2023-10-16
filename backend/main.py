import asyncio
from flask import Flask
from flask import request
from flask_cors import CORS
from datetime import datetime, date
import json_stream
import functools
import operator
import string 
import os
import shutil
import json
import re
import nltk
from nltk.corpus import stopwords
nltk.download('punkt')
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

DATABSE_FILENAME = "top20kFinal.json"

#### Keywords to filter courses for categorys ####
with open("category_keywords.json", "r") as file:
    CATEGORY_KEYWORDS = json.load(file)

#################################################
#### read json objects of dataset frunctions ####

def get_jsonlist_from_database():
    with open("./database/" + DATABSE_FILENAME, "r", encoding="utf-8") as stream: 
        return json.loads(stream.read())["kurse"]

# This function was used for the old json file format
""" def get_jsonlist_from_database():
    with open("./database/" + DATABSE_FILENAME, "r", encoding="utf-8") as stream: 
        splitCharacter = '}'
        return [json.loads(str(x + splitCharacter)) for x in stream.read().split(splitCharacter) if x != '\n' and x != '' and x != ' ' ]
 """
### filteres the json objects of the dataset for the given year ###
def filtered_jsonlist_for_year(year):
    if (year == ""):
       return [json_object for json_object in get_jsonlist_from_database()]     
    
    return [json_object for json_object in get_jsonlist_from_database() if json_object["Kursbeginn"][:4] == year]

## read json objects of dataset frunctions end ##
#################################################

#################################################
########## write data files functions ###########

# helper function to write a list format into a text file
# to save the results in seperate txt files. 
# The frontend will fetch these result txt files instead of
# calculating everything again. This speeds up the website.
def create_file_from_list(list_elem, filename):
    json_text = json.dumps(list_elem)
    with open("./database/created_files/" + filename, "w") as filestream:
        filestream.write(json_text)
""" def create_file_from_list(list_elem, filename):
    first_comma_ignored = False
    with open("./database/created_files/" + filename, "w") as filestream:
        filestream.write('[')
        for elem in list_elem:
            if elem != "":
                first_comma_ignored_2 = False
                if (first_comma_ignored != True):
                        first_comma_ignored = True
                else:
                    filestream.write(',')
                if isinstance(elem,list):
                    filestream.write('[')
                    for elem_2 in elem:
                        if (first_comma_ignored_2 != True):
                            filestream.write('"' + str(elem_2).replace('\n', '') + '"')
                            first_comma_ignored_2 = True
                        else: 
                            filestream.write(',"' + str(elem_2).replace('\n', '') + '"')
                    filestream.write(']')
                else:
                        filestream.write('"' + str(elem).replace('\n', '') + '"')
        filestream.write(']') """

### function that writes the category json file for the given year ###
def create_courses_categorys_files(year):
    with open("./database/created_files/" + year + "_courses_category.json", "w") as filestream: 
        first_comma_ignored = False   
        filestream.write("{")
        for keyword_key, keyword_list  in CATEGORY_KEYWORDS.items():
            filestream.write(",") if first_comma_ignored else {}
            first_comma_ignored = True
            filestream.write('"' + keyword_key + '": ')
            if (keyword_key == "UNKNOWN_KEYWORDS"):
                filestream.write( json.dumps([[jsonobject['Longitude'], jsonobject['Latitude'], jsonobject['Kurstitel'], jsonobject['Kursbeginn'], jsonobject['Anbietername'], jsonobject['Anbieterstrasse'], jsonobject['AnbieterPLZ'] + ' ' + jsonobject['Anbieterstadt'], jsonobject['Kurslink']] for jsonobject in filtered_jsonlist_for_year(year) if all(word not in jsonobject["Kurstitel"].lower() + jsonobject["Schlagwort"].lower() for word in functools.reduce(operator.iconcat, CATEGORY_KEYWORDS.values(), []))]))          
            else:
                filestream.write( json.dumps([[jsonobject['Longitude'], jsonobject['Latitude'], jsonobject['Kurstitel'], jsonobject['Kursbeginn'], jsonobject['Anbietername'], jsonobject['Anbieterstrasse'], jsonobject['AnbieterPLZ'] + ' ' + jsonobject['Anbieterstadt'], jsonobject['Kurslink']] for jsonobject in filtered_jsonlist_for_year(year) if any(word in jsonobject["Kurstitel"].lower() + jsonobject["Schlagwort"].lower() for word in keyword_list)]))          
        filestream.write("}")

######## write data files functions end #########
#################################################

#################################################
########### calculate data functions ############

### this function counts the amount of words for the wordcloud ###
def get_word_count_list(year):
    filter_words = set(stopwords.words('german')) 
    filter_words.update({"ca", "tage", "tag", "erstellen", "gelernt", "vertiefung", "inhalte", "sowie", "lernen", "kurs", "gelernten", "m/w/d", "i", "ii", "iii" , "iv", "teil", "stufe"})
    filter_symbols = string.punctuation + "0123456789"
    word_occurrences = nltk.FreqDist('')
    for jsonObject in filtered_jsonlist_for_year(year):
        course_titel_words = nltk.word_tokenize(((jsonObject['Kurstitel']) + jsonObject['Schlagwort']).lower())      
        word_occurrences.update([word for word in course_titel_words if word not in filter_words and word not in filter_symbols])
        
    return [list(tuple_elem) for tuple_elem in word_occurrences.most_common(100)]

### counts the occurence of the elements in the given list and
### reduce the list elements and the number of occurence of that elemnt
### example: [a,b,b,c,a,a,c,a,d] -> [[a,4],[b,2],[c,2],[d,1]]
def count_occurrences_of_each_elemt_in(list_elem):  
        amount_dict = dict()
        for key in list_elem:
                if (key in amount_dict):
                    amount_dict[key] = (amount_dict[key]) + 1
                else:
                    amount_dict[key] = 1

        return [list(tuple_elem) for tuple_elem in amount_dict.items()]

######### calculate data functions end ##########
#################################################

#################################################
################## Routings #####################

# searches for availible years in the dataset and returns the years as list
@app.route("/getAvailibleYears", methods=["GET"])
def get_existing_years_in_dataset():
    objects_per_year = set()
    for json_object in get_jsonlist_from_database():
        if json_object['Kursbeginn'][:4] != "":
            objects_per_year.add(json_object['Kursbeginn'][:4])

    list_of_years = list(objects_per_year)
    list_of_years.sort(key = lambda year: int(year))
    return list_of_years

# returns fetched data for courses per day heatmap
@app.route("/coursesStartDateNoYear", methods=["GET"])
def get_courses_start_date_no_year():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_start_dates_without_years.json", "r") as filestream:
            return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Courses Start Dates without years' found"

# returns fetched data for courses per conth chart
@app.route("/coursesStartDateNoDay", methods=["GET"])
def get_courses_start_date():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year + "_start_dates_without_day.json", "r") as filestream:
            return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Courses Start Dates without days' found"

# returns fetched data for the 4 numbers on top of the dashboard
@app.route("/generalData", methods=["GET"])
def get_general_data():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_general_infos.json", "r") as filestream:
            return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'General Infos' found"

# returns fetched data for amount of courses per provider
@app.route("/coursesProvider", methods=["GET"])
def get_courses_provider():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_course_providers.json", "r") as filestream:
                return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Course Providers' found"

# returns fetched data for the wordcloud
@app.route("/wordsCount", methods=["GET"])
def get_word_count_of_titel_and_description():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_word_occurrences.json", "r") as filestream:
                return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Word Occurrences' found"
    
# returns fetched data for the markers on the map
@app.route("/getLocations", methods=["GET"])
def get_locations():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_courses_category.json", "r") as filestream:
                return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Courses Category' found"
    
# returns fetched data for the courses per city barchart
@app.route("/getCoursesInCity", methods=["GET"])
def get_courses_in_cities():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_amount_of_courses_in_city.json", "r") as filestream:
                return filestream.read()
    except FileNotFoundError:
        return "No Data file for 'Amount of Courses in Cities' found"

# returns fetched data for the online courses
@app.route("/getOnlineCourses", methods=["GET"])
def get_online_courses():
    try:
        active_year = request.args.get('year')
        with open("./database/created_files/"+ active_year +"_online_courses.json", "r") as filestream:
                return filestream.read()
    except FileNotFoundError:
        return "No Data file 'Online Courses' found"

# called to calculate the dataset and create all files
@app.route("/runDatabase", methods=["GET"])
def run_database():
    # delete all existing files before creating new ones
    dir = './database/created_files'
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

    # calculating and creating new files
    years_in_dataset = get_existing_years_in_dataset()
    years_in_dataset.append("") # "" element is calculating data for all years
    
    for year in years_in_dataset: # for each year we are creating a file for each component

    # creating data file for courses in different categorys
        create_courses_categorys_files(year)

        # create data file for the wordcloud
        word_count_list = get_word_count_list(year)
        create_file_from_list(word_count_list, year + "_word_occurrences.json")
        del word_count_list

        # creating data file for the provider bar chart
        provider_occurrences_list = [jsonObject["Anbietername"] for jsonObject in filtered_jsonlist_for_year(year) if jsonObject["Anbietername"] != ""]
        provider_occurrences_list = count_occurrences_of_each_elemt_in(provider_occurrences_list)
        provider_occurrences_list.sort(key = lambda provider: provider[1], reverse = True)
        amount_of_provider = len(provider_occurrences_list)
        create_file_from_list(provider_occurrences_list, year + "_course_providers.json")
        del provider_occurrences_list


        # create data file for course start date (heatmap and linechart)
        start_dates_list = [jsonObject["Kursbeginn"][5:] for jsonObject in filtered_jsonlist_for_year(year) if jsonObject["Kursbeginn"] != ""]
        start_dates_list = count_occurrences_of_each_elemt_in(start_dates_list)
        start_dates_list.sort(key = lambda dates: int(dates[1]), reverse = True)
        create_file_from_list(start_dates_list, year + "_start_dates_without_years.json")
        del start_dates_list

        # create file for online courses
        online_courses = [[jsonObject["Kurstitel"], jsonObject["Kurslink"]] for jsonObject in filtered_jsonlist_for_year(year) if (any(word in jsonObject["Kurstitel"].lower() + jsonObject["Schlagwort"].lower() for word in ["webseminar", "onlinekurs"])) or (jsonObject["Longitude"] == "0.000000" and jsonObject["Latitude"] == "0.000000")]
        amount_of_online_courses = len(online_courses)
        create_file_from_list(online_courses, year + "_online_courses.json")
        del online_courses

        # create data file for amount of courses in city
        amount_of_courses_in_city = [jsonObject["Kursstadt"] for jsonObject in filtered_jsonlist_for_year(year) if  jsonObject["Kursstadt"] != ""]
        amount_of_courses_in_city = count_occurrences_of_each_elemt_in(amount_of_courses_in_city)
        amount_of_courses_in_city.sort(key = lambda city: int(city[1]), reverse = True)
        amount_of_cities = len(amount_of_courses_in_city)
        create_file_from_list(amount_of_courses_in_city, year + "_amount_of_courses_in_city.json")
        del amount_of_courses_in_city

        # create general data file
        amount_of_courses = len(filtered_jsonlist_for_year(year))
        general_infos = [amount_of_courses, amount_of_cities, amount_of_online_courses, amount_of_provider]   
        create_file_from_list(general_infos, year + "_general_infos.json")
        del general_infos, amount_of_courses, amount_of_cities, amount_of_online_courses, amount_of_provider

        # create data file for course start date (heatmap and linechart)
        start_dates_list = [jsonObject["Kursbeginn"][5:7] for jsonObject in filtered_jsonlist_for_year(year) if jsonObject["Kursbeginn"] != ""]
        start_dates_list = count_occurrences_of_each_elemt_in(start_dates_list)
        create_file_from_list(start_dates_list, year + "_start_dates_without_day.json")
        del start_dates_list

    return "All Files are created"

################ Routings end ###################
#################################################

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)