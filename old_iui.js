/*
 	 Copyright (c) 2007, iUI Project Members
	 See LICENSE.txt for licensing terms
 */


(function() {

var slideSpeed = 20;
var slideInterval = 0;

var currentPage = null;
var currentDialog = null;
var currentWidth = 0;
var currentOrientation = 42;
var currentHash = location.hash;
var hashPrefix = "#_";
var pageHistory = [];
var newPageCount = 0;
var checkTimer;
var scoreTimer;
var seriesCount = 9;
// *************************************************************************************************

window.iui =
{
    showPage: function(page, backwards)
    {
        if (page)
        {
            if (currentDialog)
            {
                currentDialog.removeAttribute("selected");
                currentDialog = null;
            }

            if (hasClass(page, "dialog"))
                showDialog(page);
            else
            {
                var fromPage = currentPage;
                currentPage = page;

                if (fromPage)
                    setTimeout(slidePages, 0, fromPage, page, backwards);
                else
                    updatePage(page, fromPage);
            }
        }
    },

    showPageById: function(pageId)
    {
        var page = $(pageId);
        if (page)
        {
            var index = pageHistory.indexOf(pageId);
            var backwards = index != -1;
            if (backwards)
                pageHistory.splice(index, pageHistory.length);

            iui.showPage(page, backwards);
        }
    },

    showPageByHref: function(href, args, method, replace, cb)
    {
        var req = new XMLHttpRequest();
        req.onerror = function()
        {
            if (cb)
                cb(false);
        };
        
        req.onreadystatechange = function()
        {
            if (req.readyState == 4)
            {
                if (replace)
                    replaceElementWithSource(replace, req.responseText);
                else
                {
                    var frag = document.createElement("div");
                    frag.innerHTML = req.responseText;
                    iui.insertPages(frag.childNodes);
                }
                if (cb)
                    setTimeout(cb, 1000, true);
            }
        };

        if (args)
        {
            req.open(method || "GET", href, true);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            //RK Commented
            /*req.setRequestHeader("Content-Length", args.length);*/
            req.send(args.join("&"));
        }
        else
        {
            req.open(method || "GET", href, true);
            req.send(null);
        }
    },
    
    insertPages: function(nodes)
    {
        var targetPage;
        for (var i = 0; i < nodes.length; ++i)
        {
            var child = nodes[i];
            if (child.nodeType == 1)
            {
                if (!child.id)
                    child.id = "__" + (++newPageCount) + "__";

                var clone = $(child.id);
                if (clone)
                    clone.parentNode.replaceChild(child, clone);
                else
                    document.body.appendChild(child);

                if (child.getAttribute("selected") == "true" || !targetPage)
                    targetPage = child;
                
                --i;
            }
        }

        if (targetPage)
            iui.showPage(targetPage);    
    },

    getSelectedPage: function()
    {
        for (var child = document.body.firstChild; child; child = child.nextSibling)
        {
            if (child.nodeType == 1 && child.getAttribute("selected") == "true")
                return child;
        }    
    }    
};

// *************************************************************************************************

addEventListener("load", function(event)
{
    var page = iui.getSelectedPage();
    if (page)
        iui.showPage(page);

    setTimeout(preloadImages, 0);
    setTimeout(checkOrientAndLocation, 0);
    checkTimer = setInterval(checkOrientAndLocation, 300);
}, false);
    
addEventListener("click", function(event)
{
	var link = findParent(event.target, "a");
    if (link)
    {
        function unselect() { link.removeAttribute("selected"); }
        if (link.getAttribute("type") == "reload")
        	loadScore();
		else if (link.getAttribute("type") == "Schedule")
		{
			schedule();
		}
        else if (link.getAttribute("type") == "myButton")
        {
			resetClass();
			setClass();
			//link.setAttribute("class", "button selected");
			eval(link.parentNode).setAttribute("class", "tabSelected");
			$("reload").removeAttribute("cc");
			$("reload").setAttribute("cc", link.getAttribute("cc"));
			loadScore();
        }
        else if (link.href && link.hash && link.hash != "#")
        {
            link.setAttribute("selected", "true");
            iui.showPage($(link.hash.substr(1)));
            setTimeout(unselect, 500);
        }
        else if (link.getAttribute("type") == "submit")
            submitForm(findParent(link, "form"));
        else if (link.getAttribute("type") == "cancel")
            cancelDialog(findParent(link, "form"));
        else if (link.target == "_replace")
        {
            link.setAttribute("selected", "progress");
            iui.showPageByHref(link.href, null, null, link, unselect);
        }
        else if (!link.target)
        {
            link.setAttribute("selected", "progress");
            iui.showPageByHref(link.href, null, null, null, unselect);
        }
        else
            return;
        
        event.preventDefault();        
    }
}, true);

addEventListener("click", function(event)
{
    var div = findParent(event.target, "div");
    if (div && hasClass(div, "toggle"))
    {
        div.setAttribute("toggled", div.getAttribute("toggled") != "true");
        
        if (div.getAttribute("toggled") == "true")
			scoreTimer = setInterval(loadScore,30000);
		if (div.getAttribute("toggled") == "false")
			clearInterval(scoreTimer);
		event.preventDefault();        
    }
}, true);

function checkOrientAndLocation()
{
    /*if (window.innerWidth != currentWidth)
    {   
        currentWidth = window.innerWidth;
        var orient = currentWidth == 320 ? "profile" : "landscape";
        document.body.setAttribute("orient", orient);
        setTimeout(scrollTo, 100, 0, 1);
    }*/
    	
    if (window.orientation != currentOrientation)
    {
		var orient;
		
		if (window.orientation == 0)
		{
			orient = 'portrait';
		}
		else if (window.orientation == 90 || window.orientation == -90)
		{
			orient = 'landscape';
		}
        
		currentOrientation = window.orientation;
		
		document.body.setAttribute("orient", orient);
		window.scrollTo(0, 1);
    }
    
	
    if (location.hash != currentHash)
    {
        var pageId = location.hash.substr(hashPrefix.length)
        iui.showPageById(pageId);
    }
}

function showDialog(page)
{
    currentDialog = page;
    page.setAttribute("selected", "true");
    
    if (hasClass(page, "dialog") && !page.target)
        showForm(page);
}

function showForm(form)
{
    form.onsubmit = function(event)
    {
        event.preventDefault();
        submitForm(form);
    };
    
    form.onclick = function(event)
    {
        if (event.target == form && hasClass(form, "dialog"))
            cancelDialog(form);
    };
}

function cancelDialog(form)
{
    form.removeAttribute("selected");
}

function updatePage(page, fromPage)
{
    if (!page.id)
        page.id = "__" + (++newPageCount) + "__";

    location.href = currentHash = hashPrefix + page.id;
    pageHistory.push(page.id);

    var pageTitle = $("pageTitle");
    if (page.title)
		pageTitle.innerHTML = page.title;

    if (page.localName.toLowerCase() == "form" && !page.target)
        showForm(page);
        
    var backButton = $("backButton");
    if (backButton)
    {
        var prevPage = $(pageHistory[pageHistory.length-2]);
        if (prevPage && !page.getAttribute("hideBackButton"))
        {
            backButton.style.display = "inline";
            backButton.innerHTML = prevPage.title ? prevPage.title : "Back";
        }
        else
            backButton.style.display = "none";
    }    
}

function slidePages(fromPage, toPage, backwards)
{        
    var axis = (backwards ? fromPage : toPage).getAttribute("axis");
    if (axis == "y")
        (backwards ? fromPage : toPage).style.top = "100%";
    else
        toPage.style.left = "100%";

    toPage.setAttribute("selected", "true");
    scrollTo(0, 1);
    clearInterval(checkTimer);
    
    var percent = 100;
    slide();
    var timer = setInterval(slide, slideInterval);

    function slide()
    {
        percent -= slideSpeed;
        if (percent <= 0)
        {
            percent = 0;
            if (!hasClass(toPage, "dialog"))
                fromPage.removeAttribute("selected");
            clearInterval(timer);
            checkTimer = setInterval(checkOrientAndLocation, 300);
            setTimeout(updatePage, 0, toPage, fromPage);
        }
    
        if (axis == "y")
        {
            backwards
                ? fromPage.style.top = (100-percent) + "%"
                : toPage.style.top = percent + "%";
        }
        else
        {
            fromPage.style.left = (backwards ? (100-percent) : (percent-100)) + "%"; 
            toPage.style.left = (backwards ? -percent : percent) + "%"; 
        }
    }
}

function preloadImages()
{
    var preloader = document.createElement("div");
    preloader.id = "preloader";
    document.body.appendChild(preloader);
}

function submitForm(form)
{
	/*if ($('q').value == "")
	{
		alert('Please enter a search term...');
	}
	else*/
    iui.showPageByHref(form.action || "POST", encodeForm(form), form.method);
}

function encodeForm(form)
{
    function encode(inputs)
    {
        for (var i = 0; i < inputs.length; ++i)
        {
            if (inputs[i].name)
                args.push(inputs[i].name + "=" + escape(inputs[i].value));
        }
    }

    var args = [];
    encode(form.getElementsByTagName("input"));
    encode(form.getElementsByTagName("select"));
    return args;    
}

function findParent(node, localName)
{
    while (node && (node.nodeType != 1 || node.localName.toLowerCase() != localName))
        node = node.parentNode;
    return node;
}

function hasClass(self, name)
{
    var re = new RegExp("(^|\\s)"+name+"($|\\s)");
    return re.exec(self.getAttribute("class")) != null;
}

function replaceElementWithSource(replace, source)
{
    var page = replace.parentNode;
    var parent = replace;
    while (page.parentNode != document.body)
    {
        page = page.parentNode;
        parent = parent.parentNode;
    }

    var frag = document.createElement(parent.localName);
    frag.innerHTML = source;

    page.removeChild(parent);

    while (frag.firstChild)
        page.appendChild(frag.firstChild);
}

function $(id) { return document.getElementById(id); }
function ddd() { console.log.apply(console, arguments); }
//function resetClass() {for (var i=1;i<=seriesCount;i++) $("cc" + i ).removeAttribute("class");}
function resetClass() {for (var i=1;i<=seriesCount;i++) eval($("cc" + i ).parentNode).removeAttribute("class");}
//function setClass() {for (var i=1;i<=seriesCount;i++) $("cc" + i ).setAttribute("class", "button normal");}
function setClass() {for (var i=1;i<=seriesCount;i++) eval($("cc" + i ).parentNode).setAttribute("class", "tabNormal");}
function loadScore(cc) {
	var d = new Date();
    var time = d.getTime(); //Math.floor(Math.random()*11);
    var s = ''
	var cc = $("reload").getAttribute('cc');
	//s += '<a href="http://' + cc +'.cricket.vcricket.com/livescore/" target="_blank">';
	//http://ifeed.vcricket.com/get_scorecard.aspx?sc=AU&sz=180x320&token=123456
	s += '<a href="http://ifeed.vcricket.com/current.aspx?t=' + cc + '" target="_blank">';

	///s += '<img src="http://' + cc + '.vcricket.com/live/240x220/T=' + time + '" width="290" height="220" border="0" alt="Live Score powered by vCricket.com">';
	
	s += '<img src="http://ifeed.vcricket.com/get_scorecard.aspx?sc=' + cc + '&sz=180x320&token=123456&T=' + time + '" width="200" height="320" border="0" alt="Live Score powered by vCricket.com">';
	
	s += '</a>';
	$("score").innerHTML = s;	
}
function schedule(){
	var s = '';
	/*s += '<table width="99%" class="tblSch" cellspacing=0 cellpadding=2 border=1>';
	s += '<tr style="font-size:13px;color:white;background-color:#333333"><td colspan="3">Schedule</td></tr>';
	s += '<tr style="font-size:12px;color:white;background-color:#6d84a2">';
	s += '<td>Date</td>';
	s += '<td>Team</td>';
	s += '<td>Venue</td>';
	s += '</tr>';
	s += '<td nowrap>May 24, 16:00<br>10:30 GMT</td>';
	s += '<td>Chennai Super Kings v<br> Rajasthan Royals</td>';
	s += '<td>Chennai</td>';
	s += '</tr>';
	s += '<td nowrap>May 24, 20:00<br>14:30 GMT</td>';
	s += '<td>Delhi Daredevils v<br> Mumbai Indians</td>';
	s += '<td>Delhi</td>';
	s += '</tr>';
	s += '<td nowrap>May 25, 16:00<br>10:30 GMT</td>';
	s += '<td>Deccan Chargers v<br> Bangalore Royal Challengers</td>';
	s += '<td>Hyderabad</td>';
	s += '</tr>';
	s += '<td nowrap>May 25, 20:00<br>14:30 GMT</td>';
	s += '<td>Kolkata Knight Riders v<br> Kings XI Punjab</td>';
	s += '<td>Kolkata</td>';
	s += '</tr>';
	s += '<td nowrap>May 26, 20:00<br>14:30 GMT</td>';
	s += '<td>Rajasthan Royals v<br> Mumbai Indians</td>';
	s += '<td>Jaipur</td>';
	s += '</tr>';
	s += '<td nowrap>May 27, 20:00<br>14:30 GMT</td>';
	s += '<td>Deccan Chargers v<br> Chennai Super Kings</td>';
	s += '<td>Hyderabad</td>';
	s += '</tr>';
	s += '<td nowrap>May 28, 16:00<br>10:30 GMT</td>';
	s += '<td>Bangalore Royal Challengers v<br> Mumbai Indians</td>';
	s += '<td>Bangalore</td>';
	s += '</tr>';
	s += '<td nowrap>May 28, 20:00<br>14:30 GMT</td>';
	s += '<td>Kings XI Punjab v<br> Rajasthan Royals</td>';
	s += '<td>Mohali</td>';
	s += '</tr>';
	s += '<td nowrap>May 30, 20:00<br>14:30 GMT</td>';
	s += '<td>1st Semi-Final - TBC v TBC</td>';
	s += '<td>Mumbai</td>';
	s += '</tr>';
	s += '<td nowrap>May 31, 20:00<br>14:30 GMT</td>';
	s += '<td>2nd Semi-Final - TBC v TBC</td>';
	s += '<td>Mumbai</td>';
	s += '</tr>';
	s += '<td nowrap>June 1, 20:00<br>14:30 GMT</td>';
	s += '<td>Final - TBC v TBC</td>';
	s += '<td>Mumbai</td>';
	s += '</tr>';
	s += '</table>'*/
	
	s = '<img src="Sch1.jpg" width="200" height="320" border="0" alt="IPL 2009 Schedule">';
	$("score").innerHTML = s;	
}
})();
