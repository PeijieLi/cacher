var SimulationStart = 0;
var simulationStep = 0;
var startIndex = 0;

var offsetbits = 0;
var tagbits = 0;
var indexbits = 0;
var cacheType = 0;
var cacheSetCount = -1;
var cacheBlockCount = -1;
var cacheBlockSize = -1;
var cachereplacement = "";

// keep those private
var prevHighlightMemoryRowIndexStart = -1;
var addressReferenceStrings = [];
var addressReferenceCounter = -1;
var Cache_Type = ["Direct Mapped Cache", " Way Set Associative Cache", "Fully Associative Cache"];
var currAddress = "";
var hits = 0;
var misses = 0;
var ishit = false;


// ---------------------------------------------------------------- Part 0: Testing ----------------------------------------
function testNext() {
    cacheBlockSize = 8;
    offsetbits = 3;

    cacheSetCount = 1;
    cacheBlockCount = 32;
    indexbits = 5;

    tagbits = 8;
    cachereplacement = "Random";
    
    cacheType = 0;

    
    
    SimulationStart = 1;

    initTIOtable();
    SimulationStart = 1;
    GenerateCacheTable();
    drawMemoryTable(0);
    autoGenerateStrings();
    initLog();
    document.getElementById("cache-title").innerHTML = cacheSetCount.toString() + Cache_Type[1];

    alert("hi");

}

// ---------------------------------------------------------------- Part 1: Set up Cache Configuration ----------------------------------------
function cacheConfigurationValidation() {
    var e = document.getElementById("blocksize");
    var input_blocksize = e.options[e.selectedIndex].value;
    var e1 = document.getElementById("blockcount");
    var input_blockcount = e1.options[e1.selectedIndex].value;
    var e2 = document.getElementById("set");
    var input_setcount = e2.options[e2.selectedIndex].value;
    var e3 = document.getElementById("placement");
    var input_placement = e3.options[e3.selectedIndex].value;
    var e4 = document.getElementById("replacement");
    var input_replacement = e4.options[e4.selectedIndex].value;
    if (input_blocksize == 0 || input_setcount == 0 || input_blockcount == 0) {
        alert("Please provide cache configurations!")
        return false;
    }
    if (input_replacement == "None" || input_placement == "None") {
        alert("Please provide cache configurations!")
        return false;
    }
    if (parseInt(input_blockcount, 10) < parseInt(input_setcount, 10)) {
        alert("Block count must be at least the number of sets in the cache!");
        return false;
    }
    // TODO: add other sanity checks
    return true;
}

function restartSimulation() {
    if (document.getElementById("startbutton").innerHTML == "Reset") {
        document.getElementById("blocksize").disabled = false;
        document.getElementById("blockcount").disabled = false;
        document.getElementById("set").disabled = false;
        document.getElementById("placement").disabled = false;
        document.getElementById("replacement").disabled = false;
        SimulationStart = 0;
        cleanStringTable();
        initTIOtable();
        GenerateCacheTable();
        drawMemoryTable(0);
        initLog();
        cleanLog();
        prevHighlightMemoryRowIndexStart = -1;
        addressReferenceStrings = [];
        addressReferenceCounter = -1;
        currAddress = "";
        hits = 0;
        misses = 0;
        ishit = false;
        simulationStep = 0;

        document.getElementById("startbutton").innerHTML = "Start Simulation";
        document.getElementById("addressInBinary").innerHTML = "";

    } else {
        if (cacheConfigurationValidation()) {
            updateCapacity();
            storeCacheConfiguration();
            initTIOtable();
            SimulationStart = 1;
            GenerateCacheTable();
            drawMemoryTable(0);
            initLog();
            cleanLog();
            appendToLog("Please provide address reference strings to start simulation.");
            document.getElementById("startbutton").innerHTML = "Reset";
            // disable select
            document.getElementById("blocksize").disabled = true;
            document.getElementById("blockcount").disabled = true;
            document.getElementById("set").disabled = true;
            document.getElementById("placement").disabled = true;
            document.getElementById("replacement").disabled = true;
            
        }
    }
}

function updateCapacity() {
    var e = document.getElementById("blocksize");
    var s = e.options[e.selectedIndex].value;
    var e1 = document.getElementById("blockcount");
    var s1 = e1.options[e1.selectedIndex].value;
    document.getElementById("capacity").innerHTML = "Cache Capacity: " + s*s1*4 + " bytes";
}

function blkCountUpdate() {
    var e1 = document.getElementById("blockcount");
    var s1 = e1.options[e1.selectedIndex].value;
    if (document.getElementById("placement").value == 2) {
        var element = document.getElementById("set");
        element.value = s1;
    }
}

function storeCacheConfiguration() {
    var e = document.getElementById("blocksize");
    cacheBlockSize = parseInt(e.options[e.selectedIndex].value, 10);
    var e1 = document.getElementById("blockcount");
    cacheBlockCount = e1.options[e1.selectedIndex].value;
    var e2 = document.getElementById("set");
    cacheSetCount = e2.options[e2.selectedIndex].value;
    var e3 = document.getElementById("placement");
    cacheType = e3.options[e3.selectedIndex].value;
    var e4 = document.getElementById("replacement");
    cachereplacement = e4.options[e4.selectedIndex].value;

    offsetbits = Math.log2(cacheBlockSize);
    indexbits = Math.log2(cacheBlockCount/cacheSetCount);
    tagbits = 16-offsetbits-indexbits;

    if (cacheType == 1) {
        document.getElementById("cache-title").innerHTML = cacheSetCount.toString() + Cache_Type[1];
    } else {
        document.getElementById("cache-title").innerHTML = Cache_Type[cacheType];
    }

}

// =================================================== Simulation Steps: ===================================================
function nextStep() {
    if (SimulationStart == 0) {
        alert("Please start simulation first!");
        return;
    }
    if (addressReferenceStrings.length == 0 || addressReferenceCounter == addressReferenceStrings.length) {
        alert("Please provide more addresses for simulation to continue.");
        return;
    }
    // TODO: add check
    if (simulationStep == 0) {
        // Step a: read in the next address string
        addressReferenceCounter += 1;
        if (addressReferenceCounter >= addressReferenceStrings.length) {
            alert("Please provide more address reference string in order to continue!");
            addressReferenceCounter -= 1;
        } else {
            currAddress = addressReferenceStrings[addressReferenceCounter];
            document.getElementById("addr"+addressReferenceCounter.toString()).style.backgroundColor = "#FFB533";
            if (addressReferenceCounter > 0)
                document.getElementById("addr"+(addressReferenceCounter-1).toString()).style.backgroundColor = "AntiqueWhite";
            // Step b: append to log
            appendToLog("The memory address we want is obtained from the Address Reference String. It is (in hexadecimal): "+currAddress.toString(16)+".\n");
           // step c: proceed to next step
            simulationStep =(simulationStep+1) % 10;
        }
    } else if (simulationStep == 1) {
        // step a: convert it to binary & update TIO table
        UpdateTIOtable(currAddress);
        var addressInHex = currAddress.toString(16);
        var addressInBinary = convertToBinary(parseInt(currAddress, 16), 16);
        document.getElementById("addressInBinary").innerHTML = "Address Reference String: 0x"+addressInHex+" ==> 0b"+ convertToBinary(parseInt(currAddress, 16), 16);
        document.getElementById("tag").style.backgroundColor = "#00FF00";
        document.getElementById("index").style.backgroundColor = "#00FF00";
        document.getElementById("offset").style.backgroundColor = "#00FF00";

        // step b: append to log
        appendToLog("The hexadecimal address " + addressInHex + " evaluates to its binary equivalent " + addressInBinary+".");
        appendToLog("Hence the bits in the Main Memory Address are divided into the following fields: ");
        if (indexbits == 0)
            appendToLog("Tag: " + addressInBinary.substring(0, tagbits) + ", Index: None"+", Offset: "+addressInBinary.substring(tagbits+indexbits, addressInBinary.length)+"\n");
        else
            appendToLog("Tag: " + addressInBinary.substring(0, tagbits) + ", Index: "+addressInBinary.substring(tagbits, tagbits + indexbits) + ", Offset: "+addressInBinary.substring(tagbits+indexbits, addressInBinary.length)+"\n");
        // step c: proceed to next step
        simulationStep =(simulationStep+1) % 10;
    } else if (simulationStep == 2) {
        // step a: highlight index cell and use it to find corresponding cache row
        var addressInBinary = convertToBinary(parseInt(currAddress, 16), 16);
        var addressIndex = addressInBinary.substring(tagbits, tagbits + indexbits);
        document.getElementById("tag").style.backgroundColor = "";
        document.getElementById("offset").style.backgroundColor = "";
        document.getElementById("index").style.backgroundColor = "#F4D03F";
        searchForCacheRow(currAddress);

        // step b: append to log
        appendToLog("We use the index bits to look for the cache row, which contains one or more candidate cache blocks that may or may not have the data we'd want to access.");

        appendToLog("The INDEX bits are " + addressIndex + ", indicating the candidate cache blocks are located at row " + parseInt(addressIndex, 2).toString() + "(0b"+addressIndex+").");
        // step c: proceed to next step
        simulationStep =(simulationStep+1) % 10;

    } else if (simulationStep == 3) {
        // step a: find valid bit and tag bits for each block on the cache row.
        // highlight them and use them for cache hit check in next step
        document.getElementById("index").style.backgroundColor = "";
        searchForCacheBlock(currAddress);

        // step b: append to log
        appendToLog("There are " + cacheSetCount.toString() + " blocks within one cache row. We will need to analyze each of them and check their valid bit and tag bits).");
        appendToLog("\n");
        // step c: proceed to next step
        simulationStep =(simulationStep+1) % 10;

    } else if (simulationStep == 4) {
        // step a: show the result of valid+tag check for each block
        document.getElementById("tag").style.backgroundColor = "#00FF00";
        document.getElementById("offset").style.backgroundColor = "";
        document.getElementById("index").style.backgroundColor = "";
        var result = showCacheValidation(currAddress);
        var addressInBinary = convertToBinary(parseInt(currAddress, 16), 16);
        var addressTag = addressInBinary.substring(0, tagbits);

        // step b
        appendToLog("To have a cache hit, we need to find a cache block that is valid and has a tag same as the one of the memory address.");
        appendToLog("The tag of the main memory address is "+addressTag+".");


        if (result) {
            // find a hit
            appendToLog("A block of the cache already contains this required data, so we can now access it from cache as needed.");
            simulationStep = 8;
            incHit();
            ishit = true;
            // simulationStep += 4;
        } else {
            // it's a miss
            appendToLog("None of the blocks at the cache row gives a cache hit. We have a cache miss and will need to bring in the block from main memory.");
            // step c: proceed to next step
            simulationStep =(simulationStep+1) % 10;
            incMiss();
            ishit=false;
        }
        appendToLog("\n");

    } else if (simulationStep == 5) {
        // we've seen a cache miss
        // highlihght the data block in memory
        // step a:
        highlightMemoryRow(parseInt(currAddress, 16));

        // step b
        appendToLog("We look for the data from main memory. The byte located at the requested address is highlighted in blue");
        appendToLog("We will need to bring in more than the data highlighted in blue to cache. It is because cache block has a size of "+cacheBlockSize+" bytes. This is the unit of any data transfer between cache and main memory.") // explain why multiple blocks are highlighted and the different green and blue color
        appendToLog("\n");
        // step c: proceed to next step
        simulationStep =(simulationStep+1) % 10;
        
    } else if (simulationStep == 6) {
        // we've seen a cache miss
        // highlight the cache block that's to be replaced
        blockToReplace = searchForBlockToReplace(currAddress);
        // step b
        if (cachereplacement == "LRU") {
            appendToLog("The cache replacement policy is Least Recently Used (LRU). The least recently accessed block is chosen to overwrite with the data we brought from main memory.");
        } else {
            appendToLog("The cache replacement policy is Random. A block is randomly chosen to overwrite with the data we brought from main memory.");
        }
        appendToLog("\n");
        // go to step 4 if tag matches, otherwise jump to step 5
        simulationStep =(simulationStep+1) % 10;

    } else if (simulationStep == 7) {
        // we've seen a cache miss
        // update cache. highlight the cache and highlight the newly written tag and data
        var newcachedata = replaceCacheBlock(currAddress);
        // step b
        var addressInBinary = convertToBinary(parseInt(currAddress, 16), 16);
        var addressTag = addressInBinary.substring(0, tagbits);

        appendToLog("Now that the required memory block is in cache. We note the following 3 things:");
        appendToLog("1. The cache block has a tag associated with it. The tag, as specified by the Tag bits in the memory address, is "+addressTag);
        appendToLog("2. The data bits, as highlighted in Main Memory, are "+newcachedata);
        appendToLog("3. If the cache was originally empty or contained a memory block other than the one we required, the count of Cache Misses was incremented. If the cache already had the required memory block in it, then the count of Cache Hits was incremented.");
        simulationStep =(simulationStep+1) % 10;
        appendToLog("\n");

    } else if (simulationStep == 8) {
        // Continue to cache hit
        // highlihght cache to be green
        highlightCacheBlockToReturn();
        if (ishit) {
            if (cachereplacement == "LRU") {
                // update LRU 
                var hitblock = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"lru");
                for (var j = 0; j < cacheSetCount; j++) {
                    var otherblock = document.getElementById("row"+blockToReplace.row.toString()+"set"+j.toString()+"lru");
                    if (parseInt(otherblock.innerHTML, 2) < parseInt(hitblock.innerHTML, 2)) 
                        otherblock.innerHTML = convertToBinary((parseInt(otherblock.innerHTML, 2) + 1) % cacheSetCount, Math.log2(cacheSetCount));
                }
            }
            appendToLog("The cache block highlighted in green contains requested data."); 
        } else {
            appendToLog("The cache block highlighted in green now contains requested data."); 
        }
        appendToLog("\n");
        simulationStep = (simulationStep+1) % 10;
    } else {
        document.getElementById("tag").style.backgroundColor = "";
        document.getElementById("offset").style.backgroundColor = "";
        document.getElementById("index").style.backgroundColor = "";
        document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"valid").style.backgroundColor = "";
        document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"tag").style.backgroundColor = "";
        document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"data").style.backgroundColor = "";
        if (cachereplacement == "LRU") {
            document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"lru").style.backgroundColor = "";
        }
        highlightMemoryRow(-1);
        blockToReplace = null;

        appendToLog("This completes an access cycle."); 
        appendToLog("\n");
        
        simulationStep -= 9;
    }
}

function prevStep() {
    alert("not implemented");
}



// step 2
function searchForCacheRow(address) {
    address = convertNumber(address, 16, 2);
    var cacheRowIndex = null;
    if (indexbits == 0) {
        cacheRowIndex = 0;
    } else {
        cacheRowIndex = parseInt(address.substring(tagbits, tagbits + indexbits), 2);
    }
    var cacheRow = document.getElementById("row"+cacheRowIndex.toString());
    cacheRow.style.backgroundColor = "#F4D03F";
    // scroll to the cache row
    // var d = document.getElementById("cacheTableSpace");
    // d.scrollTop = scrollTop;
    cacheRow.scrollIntoView(false); 
}

// step 3
function searchForCacheBlock(address) {
    address = convertNumber(address, 16, 2);
    var cacheRowIndex = null;
    if (indexbits == 0) {
        cacheRowIndex = 0;
    } else {
        cacheRowIndex = parseInt(address.substring(tagbits, tagbits + indexbits), 2);
    }
    for (var i = 0; i < cacheSetCount; i++) {
        var cacheblock_valid = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"valid");
        var cacheblock_tag = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"tag");
        cacheblock_tag.style.backgroundColor = "#FF00FF";//"#F08080";
        cacheblock_valid.style.backgroundColor = "#FF00FF";
    }
}

// step 4:
function showCacheValidation(address) {
    address = convertNumber(address, 16, 2);
    var addressTag = address.substring(0, tagbits);
    // getBoundingClientRect();
    var cacheRowIndex = null;
    if (indexbits == 0) {
        cacheRowIndex = 0;
    } else {
        cacheRowIndex = parseInt(address.substring(tagbits, tagbits + indexbits), 2);
    }
    var hit = false;
    for (var i = 0; i < cacheSetCount; i++) {
        var validCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"valid");
        var tagCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"tag");
        if (validCell.innerHTML == "True")
            validCell.style.backgroundColor = "#00FF00";
        else
            validCell.style.backgroundColor = "#FF0000";
        if (tagCell.innerHTML == addressTag)
            tagCell.style.backgroundColor = "#00FF00";
        else
            tagCell.style.backgroundColor = "#FF0000";
        if (validCell.innerHTML == "True" && tagCell.innerHTML == addressTag) {
            blockToReplace = {row: cacheRowIndex, set: i};
            hit = true;
        }
    }
    return hit;
}

var blockToReplace = null; // also the block to return 

function searchForBlockToReplace(address) {
    // this function is only called when we have a cache miss

    address = convertNumber(address, 16, 2);
    var cacheRowIndex = null;
    if (indexbits == 0) {
        cacheRowIndex = 0;
    } else {
        cacheRowIndex = parseInt(address.substring(tagbits, tagbits + indexbits), 2);
    }
    // if random replacement:
    if (cachereplacement == "Random") {
        var lucky = getRndInteger(0,3);
        var sadValidCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+lucky.toString()+"valid");
        sadValidCell.style.backgroundColor = "#00FFFF";

        var sadTagCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+lucky.toString()+"tag");
        sadTagCell.style.backgroundColor = "#00FFFF";
        // var sadDirtyCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+lucky.toString()+"dirty");
        // sadDirtyCell.style.backgroundColor = "#00FFFF";
        var sadDataCell = document.getElementById("row"+cacheRowIndex.toString()+"set"+lucky.toString()+"data");
        sadDataCell.style.backgroundColor = "#00FFFF";
        sadDataCell.scrollIntoView(false); 
        return {row: cacheRowIndex, set: lucky};
    } else if (cachereplacement == "LRU") {
        for (var i = 0; i < cacheSetCount; i++) {
            var lrucell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"lru");
            if (parseInt(lrucell.innerHTML, 2) == cacheSetCount-1) {
                var validcell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"valid");
                // var dirtycell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"dirty");
                var datacell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"data");
                var tagcell = document.getElementById("row"+cacheRowIndex.toString()+"set"+i.toString()+"tag");
                validcell.style.backgroundColor = "#00FFFF";
                // dirtycell.style.backgroundColor = "#00FFFF";
                datacell.style.backgroundColor = "#00FFFF";
                tagcell.style.backgroundColor = "#00FFFF";
                lrucell.style.backgroundColor = "#00FFFF";
                lrucell.scrollIntoView(false);
                return {row: cacheRowIndex,set: i};
            }
        }
        return null;
    }
}

function replaceCacheBlock(address) {
    // blockToReplace contains row and set information.
    var targetCell_valid = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"valid");
    targetCell_valid.innerHTML = "True";

    // targetCell_dirty = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"dirty");
    // targetCell_dirty = 
    address = convertNumber(address, 16, 2);
    var targetCell_tag = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"tag");
    targetCell_tag.innerHTML = address.substring(0, tagbits);

    // compute main memory block information
    var memoryCell_start = document.getElementById("Address"+parseInt(address, 2).toString());
    var i = parseInt(address, 2)+cacheBlockSize - 2;
    var memoryCell_end = document.getElementById("Address"+i.toString());
    var targetCell_data = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"data");
    targetCell_data.innerHTML = memoryCell_start.innerHTML.substring(3, memoryCell_start.innerHTML.length) + "~"+memoryCell_end.innerHTML.substring(3, memoryCell_end.innerHTML.length);// memory data
    if (cachereplacement == "LRU") {
        var targetCell_lru = document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"lru");
        var lru_threshold = parseInt(targetCell_lru.innerHTML, 2);
        for (var i = 0; i < cacheSetCount; i++) {
            var lrucell = document.getElementById("row"+blockToReplace.row.toString()+"set"+i.toString()+"lru");
            if (parseInt(lrucell.innerHTML, 2) < lru_threshold)
                lrucell.innerHTML = convertToBinary(((parseInt(lrucell.innerHTML, 2) + 1) % cacheSetCount), Math.log2(cacheSetCount));
        }
        targetCell_lru.innerHTML = convertToBinary(0, Math.log2(cacheSetCount));
    }
    return targetCell_data.innerHTML;
}

function highlightCacheBlockToReturn() {
    // clean other highlights from the cache
    document.getElementById("row"+blockToReplace.row.toString()).style.backgroundColor = "";
    for (var j = 0; j < cacheSetCount; j++) {
        document.getElementById("row"+blockToReplace.row.toString()+"set"+j.toString()+"valid").style.backgroundColor = "";
        document.getElementById("row"+blockToReplace.row.toString()+"set"+j.toString()+"tag").style.backgroundColor = "";
    }

    document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"valid").style.backgroundColor = "green";
    document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"tag").style.backgroundColor = "green";
    document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"data").style.backgroundColor = "green";
    if (cachereplacement == "LRU")
        document.getElementById("row"+blockToReplace.row.toString()+"set"+blockToReplace.set.toString()+"lru").style.backgroundColor = "green";

}


// ------------------------------------- Part 2: Initialize Tables (TIO, CACHE, MEMORY Tables) ------------------------------------------------------
function initLog() {
    var x = document.getElementById("log");
    if (x == null) {
        var div = document.getElementById("logArea");
        x = document.createElement("TEXTAREA");
        x.readOnly = true;
        x.cols = "100";
        x.rows = "10";
        x.style.resize = "none";
        x.style.overflow = "auto";
        x.id = "log";
        var t = document.createTextNode("Please enter cache configurations.\n");
        x.appendChild(t);
        div.appendChild(x);

        document.getElementById("hits").innerHTML = "Cache Hits: N/A";
        document.getElementById("misses").innerHTML = "Cache Misses: N/A";
        document.getElementById("Hit-Rate").innerHTML = "Cache Hit Rate: N/A?";
    }
    document.getElementById("logHeader").innerHTML = "Progress Update";
}

function cleanLog() {
    var x = document.getElementById("log");
    x.value = "";

    document.getElementById("hits").innerHTML = "Cache Hits: N/A";
    document.getElementById("misses").innerHTML = "Cache Misses: N/A";
    document.getElementById("Hit-Rate").innerHTML = "Cache Hit Rate: N/A?";
}

function incHit() {
    hits += 1;
    document.getElementById("hits").innerHTML = "Cache Hits: "+hits.toString();
    var hitrate = hits/(hits+misses);
    document.getElementById("Hit-Rate").innerHTML = "Cache Hit Rate: " + hitrate.toString();
    document.getElementById("misses").innerHTML = "Cache Misses: "+misses.toString();
}

function incMiss() {
    misses += 1;
    document.getElementById("misses").innerHTML = "Cache Misses: "+misses.toString();
    var hitrate = hits/(hits+misses);
    document.getElementById("Hit-Rate").innerHTML = "Cache Hit Rate: " + hitrate.toString();
    document.getElementById("hits").innerHTML = "Cache Hits: "+hits.toString();
}

function appendToLog(text) {
    var t = document.getElementById("log");
    t.value += text+"\n";
    t.scrollTop = t.scrollHeight;

}

function GenerateCacheTable() {
    document.getElementById("cacheHeader").innerHTML = "Cache Table";
    // Initiate cache table based on cache configuration and show on webpage
    // # of blocks per row = # of sets = cacheSetCount
    // # rows = # blocks / # of set = cacheBlockCount / cacheSetCount
    var table = document.getElementById('cacheTable');
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    var headerRow = table.insertRow(0);
    var header_index = headerRow.insertCell(-1);
    header_index.innerHTML = "Index";
    for (var h = 0; h < cacheSetCount; h++) {
        var header_valid = headerRow.insertCell(-1);
        // var header_dirty = headerRow.insertCell(-1);
        var header_tag = headerRow.insertCell(-1);
        var header_data = headerRow.insertCell(-1);
        if (cachereplacement == "LRU") {
            var header_LRU = headerRow.insertCell(-1);
            header_LRU.innerHTML = "LRU";
        }
        // header_dirty.innerHTML = "Dirty";
        header_valid.innerHTML = "Valid";
        header_tag.innerHTML = "Tag";
        header_data.innerHTML = "Data";
    }

    for (var i = 0; i < cacheBlockCount/cacheSetCount; i++) {
        var row = table.insertRow(-1);
        row.id = "row"+i.toString();
        var cell_index = row.insertCell(-1);
        cell_index.innerHTML = i.toString(10)+"("+convertToBinary(i, indexbits)+")";
        cell_index.id = "row"+i.toString()+"index";
        // add cells
        for (var j = 0; j < cacheSetCount; j++) {
            var cell_valid = row.insertCell(-1);
            cell_valid.innerHTML = "False";
            // var cell_dirty = row.insertCell(-1);
            // cell_dirty.innerHTML = "False";
            var cell_tag = row.insertCell(-1);
            cell_tag.innerHTML = "X".repeat(tagbits);
            var cell_data = row.insertCell(-1);
            cell_data.innerHTML = "X".repeat(Math.min(Math.pow(2, offsetbits), 10));

            cell_valid.id = "row"+i.toString()+"set"+j.toString()+"valid";
            // cell_dirty.id = "row"+i.toString()+"set"+j.toString()+"dirty";
            cell_tag.id = "row"+i.toString()+"set"+j.toString()+"tag";
            cell_data.id = "row"+i.toString()+"set"+j.toString()+"data";
            if (cachereplacement == "LRU") {
                var cell_LRU = row.insertCell(-1);
                cell_LRU.id = "row"+i.toString()+"set"+j.toString()+"lru";
                cell_LRU.innerHTML = convertToBinary(cacheSetCount-1, Math.log2(cacheSetCount));
            }
        }
    }
}

function initTIOtable() {
    document.getElementById("tioHeader").innerHTML = "TIO Table";
    var table = document.getElementById("tio_table");
    // clean table for init function
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    var headerRow = table.insertRow(-1);
    var header_col1= headerRow.insertCell(-1);
    var header_col2 = headerRow.insertCell(-1);
    var header_col3 = headerRow.insertCell(-1);
    header_col1.innerHTML = "Tag ("  +tagbits.toString()   +" bits)";
    header_col2.innerHTML = "Index (" +indexbits.toString() +" bits)";
    header_col3.innerHTML = "Offset ("+offsetbits.toString()+" bits)";

    // draw body
    var bodyRow = table.insertRow(-1);
    var body_col1= bodyRow.insertCell(-1);
    var body_col2 = bodyRow.insertCell(-1);
    var body_col3 = bodyRow.insertCell(-1);
    body_col1.innerHTML = "X".repeat(tagbits);
    body_col2.innerHTML = "X".repeat(indexbits);
    body_col3.innerHTML = "X".repeat(offsetbits);
    body_col1.id="tag";
    body_col2.id="index";
    body_col3.id="offset";
}

function UpdateTIOtable(address) {
    // convert address from hex to binary
    address = convertNumber(address, 16, 2);
    var tagCell = document.getElementById("tag");
    tagCell.innerHTML = address.substring(0,tagbits);

    var offsetCell = document.getElementById("offset");
    offsetCell.innerHTML = address.substring(tagbits+indexbits,address.length);

    var indexCell = document.getElementById("index");
    if (indexbits == 0)
        indexCell.innerHTML = "None";
    else
        indexCell.innerHTML = address.substring(tagbits,tagbits+indexbits);
}

function drawMemoryTable(startIndex) {
    document.getElementById("memoryHeader").innerHTML = "Main Memory";
    // startIndex = max(0, startIndex);
    var table = document.getElementById('memory_table');
    if (startIndex < 0)
        startIndex = 0;
    // clean table first
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    // draw header rows
    var headerRow = table.insertRow(0);
    var header_col1= headerRow.insertCell(-1);
    var header_col2 = headerRow.insertCell(-1);
    var header_col3 = headerRow.insertCell(-1);
    var header_col4 = headerRow.insertCell(-1);
    var header_col5 = headerRow.insertCell(-1);
    header_col1.innerHTML = "Addr";
    header_col2.innerHTML = "+0";
    header_col3.innerHTML = "+1";
    header_col4.innerHTML = "+2";
    header_col5.innerHTML = "+3";

    // draw memory contents: a max of 41 rows
    for (var i = startIndex; i < startIndex + 41; i++) {
        var memoryRow = table.insertRow(-1);
        memoryRow.id = "memoryRow"+i.toString();
        // draw addres cell
        var addressCell = memoryRow.insertCell(-1);
        addressCell.id = "AddressCell"+i.toString(); // i is the index/ row number
        addressCell.innerHTML = (4*i).toString(16);
        for (var j = 0; j < 4; j++) {
            // indert Cells
            var memoryCell = memoryRow.insertCell(-1);
            var cell_address = 4*i + j;
            memoryCell.id = "Address"+cell_address.toString();
            memoryCell.innerHTML = "B" + (i*4+j)%4 + " W" + i;
        }
    }
}

// highlight memory cells based on target Address and cache block size
function highlightMemoryRow(targetAddress) {
    if (targetAddress >= 0) {
        var rowIndexStart = Math.floor(targetAddress / 4);
        var rowIndexEnd = rowIndexStart + cacheBlockSize/4;
        var targetRowStart = document.getElementById("memoryRow"+rowIndexStart.toString());
        var targetRowEnd = document.getElementById("memoryRow"+rowIndexEnd.toString());
        if (targetRowStart == null || targetRowEnd == null) {
            drawMemoryTable(rowIndexStart - 10);//place the target cell/row in the upper-middle of the page
            targetRowStart = document.getElementById("memoryRow"+rowIndexStart.toString());
            targetRowEnd = document.getElementById("memoryRow"+rowIndexEnd.toString());
        }

        for (var i = rowIndexStart; i < rowIndexEnd; i+=1) {
            var targetRow = document.getElementById("memoryRow"+i.toString());
            targetRow.style.backgroundColor = "#00FF00";
        }
        // highlight the target block in blue
        var targetCell = document.getElementById("Address"+targetAddress.toString());
        targetCell.style.backgroundColor = "#43B0F7";
    }

    // clear previous highlighted rows
    if (prevHighlightMemoryRowIndexStart >= 0) {
        var prevRowIndexStart = prevHighlightMemoryRowIndexStart;
        var prevRowIndexEnd = prevHighlightMemoryRowIndexStart + cacheBlockSize/4;
        for (var j = prevRowIndexStart; j < prevRowIndexEnd; j++) {
            prevRow = document.getElementById("memoryRow"+j.toString());
            if (prevRow)
                prevRow.style.backgroundColor = "AntiqueWhite";
        }
    }
    //update prevHighlightMemoryRowIndexStart
    prevHighlightMemoryRowIndexStart = rowIndexStart;
}



// =================================================== Part 3: Generate Address String Reference =================================================== 
function AddToStringTable(addressArray) {
    // add address strings in <addressArray> to the table shown on html page.
    var table = document.getElementById('stringTable');

    for(var i = 0; i < addressArray.length; i++) {
        var row = table.insertRow(-1);
        var cell = row.insertCell(0);
        cell.id = "addr"+(table.getElementsByTagName("tr").length-1).toString();
        cell.innerHTML = addressArray[i];
    }
}

function cleanStringTable() {
    var table = document.getElementById('stringTable');
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    addressReferenceStrings = [];
}

function autoGenerateStrings() {
    // generte 10 random address strings (each of 16 bits)
    var newstrings = [];
    for (var i = 0; i < 10; i++)
        newstrings.push(generateRandomString());
    addressReferenceStrings = addressReferenceStrings.concat(newstrings);
    AddToStringTable(newstrings);
}

function generateRandomString() {
    var text = "";
    var possible = "ABCDEF0123456789";
    for (var i = 0; i < 4; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function enterString() {
    // pop up windows to allow user enter an address string manually.
    var str = prompt("Please enter an address in hex (4 digits):", "AABC");
    var re = /[0-9A-Fa-f]{4}/g;
    if (str != null && re.test(str)) {
        addressReferenceStrings.push(str);
        AddToStringTable([str]);
    } else {
        alert("Invalid address: Please enter an address in hex (4 digits)");
    }
}

// =============================================================== Utility =======================================================
function convertNumber(n, fromBase, toBase) {
  if (fromBase === void 0) {
    fromBase = 10;
  }
  if (toBase === void 0) {
    toBase = 10;
  }
  var retStr = parseInt(n.toString(), fromBase).toString(toBase);
  return "0".repeat(16-retStr.length)+retStr;
}

function convertToBinary(num, len) {
    var retStr = num.toString(2);
    if (retStr.length < len) {
        return "0".repeat(len-retStr.length)+retStr;
    } else {
        return retStr;
    }
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}